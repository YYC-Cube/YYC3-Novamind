/**
 * YYC³ NovaMind · 上下文工程引擎（文档 06 · Phase D 资产 10）
 *
 * Claude Code / Cursor 式上下文治理的三件套对标落地：
 * - buildContext 分区：system 保留 / 近 N 轮全保 / 更早摘要压缩（超窗触发）
 * - estimateContextTokens：复用资产 1 estimateTokens（2.5 char/token 折中口径）
 * - RAG 注入：searchKnowledge 命中 → system 附加知识片段（带来源标注）
 * - prepareStep 协同：Agent 每步动态裁剪工具结果（截头保尾 — 尾部含最新执行上下文）
 *
 * 降级语义（零依赖原则）：
 * - 无 OPENAI_API_KEY → 摘要压缩退化为滑动窗口截断（保近端）
 * - searchKnowledge 降级/未命中 → 跳过注入，system 不变
 */
import { estimateTokens } from "@/lib/api-guard"
import type { ModelMessage } from "ai"

// ─────────────────────────── 常量与类型 ───────────────────────────

/** 默认上下文窗口预算（token，约 8k 模型的 1/4 — 保守值，可按模型升级） */
export const CONTEXT_WINDOW_BUDGET = 2000

/** 摘要压缩触发阈值：超出预算即触发 */
/** 滑动窗口：全保近端 token 预算占比（其余给摘要 + system + RAG） */
export const RECENT_RATIO = 0.5

/** 单工具结果截断保留的尾部字符数（保尾：尾部含最新执行结果） */
export const TOOL_RESULT_TAIL_CHARS = 800

/** 摘要提示词（廉价模型滚动摘要用） */
export const SUMMARY_PROMPT = [
  "你是对话摘要助手。将历史对话压缩为一段不超过 300 字的摘要：",
  "保留用户目标、已做决定、关键事实与未完成事项，省略寒暄与重复内容。",
  "直接输出摘要正文，不要任何前后缀。",
].join("")

/** 上下文分区结果 */
export interface ContextPartition {
  /** 全量保留的近期消息（永远不压缩） */
  recent: { role: "user" | "assistant" | "system"; content: string }[]
  /** 被摘要压缩的早期消息（空数组 = 未触发压缩） */
  older: { role: "user" | "assistant" | "system"; content: string }[]
  /** 是否触发摘要压缩（older 非空且超预算） */
  needsSummary: boolean
  /** 全上下文估算 token（含 system） */
  estimatedTokens: number
}

/** buildContext 入参 */
export interface BuildContextOptions {
  /** system 提示词（保留原样，注入 RAG 后仍置于最前） */
  system?: string
  /** RAG 检索片段（带来源标注的注入块，可选） */
  knowledgeContext?: string
  /** 上下文 token 预算（缺省 CONTEXT_WINDOW_BUDGET） */
  budgetTokens?: number
  /** 近端全保 token 上限（缺省按 RECENT_RATIO 比例切分） */
  recentBudgetTokens?: number
}

/** buildContext 输出 */
export interface BuiltContext {
  /** 送给模型的 messages（不含 system — system 独立返回，经 generateText({ system }) 传入） */
  messages: { role: "user" | "assistant" | "system"; content: string }[]
  /** 摘要 + RAG 注入后的完整 system 提示词（空串 = 无） */
  system: string
  /** 压缩诊断信息 */
  meta: {
    originalTokens: number
    compressedTokens: number
    summarizedCount: number
    truncatedToolResults: number
    knowledgeInjected: boolean
    summaryMode: "model" | "sliding-window" | "none"
  }
}

// ─────────────────────────── Token 估算 ───────────────────────────

/** 消息数组 token 估算（复用资产 1 口径：2.5 char/token） */
export function estimateContextTokens(
  messages: { content: unknown }[],
): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
}

// ─────────────────────────── 分区 ───────────────────────────

/**
 * 上下文分区：system 保留 / 近端全保 / 远端进摘要候选
 *
 * 分区规则：
 * 1. 从最新消息往前累计 token，直到吃满近端预算 → recent
 * 2. 剩余头部消息 → older（摘要候选）
 * 3. needsSummary = older 存在 且（older 或整体）超预算
 */
export function partitionContext(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  options: { recentBudgetTokens?: number } = {},
): ContextPartition {
  const recentBudget = options.recentBudgetTokens ?? Math.floor(CONTEXT_WINDOW_BUDGET * RECENT_RATIO)

  // 从尾往前装近端窗口
  const recent: ContextPartition["recent"] = []
  let used = 0
  let cut = messages.length
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = estimateTokens(messages[i]!.content)
    if (used + t > recentBudget && recent.length > 0) break
    // 单条超预算也保底收进 recent（避免空 recent 死循环）
    recent.unshift(messages[i]!)
    used += t
    cut = i
  }

  const older = messages.slice(0, cut)
  const allTokens = estimateContextTokens(messages)
  const needsSummary = older.length > 0 && allTokens > recentBudget

  return { recent, older, needsSummary, estimatedTokens: allTokens }
}

// ─────────────────────────── 摘要压缩 ───────────────────────────

/** 滑动窗口降级：older 直接丢弃（保留首条话题作为占位提示） */
export function slidingWindowFallback(older: ContextPartition["older"]): string {
  if (older.length === 0) return ""
  const first = older[0]!
  return [
    `[早期对话已省略 ${older.length} 条，涉及「${first.content.slice(0, 40)}」等话题]`,
  ].join("")
}

/** OpenAI 兼容消息结构（内部契约：role/content 字符串） */
interface OpenAIMessage {
  role: "user" | "assistant" | "system"
  content: string
}

/**
 * 廉价模型滚动摘要：超窗 older → 300 字摘要
 * OPENAI_API_KEY 缺失时抛错（调用方 catch 后走 slidingWindowFallback）
 */
export async function summarizeWithModel(older: OpenAIMessage[]): Promise<string> {
  if (older.length === 0) return ""
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY 缺失：无法调用摘要模型")
  }

  const { generateText } = await import("ai")
  const { openai } = await import("@ai-sdk/openai")

  const transcript = older
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
    .slice(0, 12_000) // 摘要输入自身也要限幅

  const { text } = await generateText({
    model: openai(process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini"),
    prompt: `${SUMMARY_PROMPT}\n\n<conversation>\n${transcript}\n</conversation>`,
    temperature: 0.3,
    maxOutputTokens: 500,
  })
  return text.trim()
}

// ─────────────────────────── RAG 注入 ───────────────────────────

/** RAG 检索结果 → 带来源标注的注入块（未命中/降级返回空串） */
export function formatKnowledgeContext(
  chunks: { content: string; documentId: string; score: number }[],
): string {
  if (chunks.length === 0) return ""
  const items = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (doc:${c.documentId.slice(0, 8)} score:${c.score.toFixed(2)})\n${c.content}`,
    )
    .join("\n\n")
  return `<knowledge>\n以下是与用户问题相关的知识库片段，回答时可引用（标注 [n] 来源）：\n\n${items}\n</knowledge>`
}

// ─────────────────────────── 工具结果裁剪 ───────────────────────────

/**
 * 工具结果超长截断（截头保尾）— prepareStep 协同用
 * AI SDK v5 ToolResultPart.output：{ type: 'text'|'json'|..., value }
 */
export function truncateToolResultPart(
  part: { output: { type: string; value: unknown } },
  tailChars = TOOL_RESULT_TAIL_CHARS,
): boolean {
  if (part.output?.type !== "text" || typeof part.output.value !== "string") return false
  if (part.output.value.length <= tailChars) return false
  const tail = part.output.value.slice(-tailChars)
  part.output.value = `[...前文已截断...]\n${tail}`
  return true
}

/** 消息数组内的 tool-result 文本裁剪（返回裁剪数） */
export function truncateToolResults(
  messages: ModelMessage[],
  tailChars = TOOL_RESULT_TAIL_CHARS,
): number {
  let count = 0
  for (const msg of messages) {
    if (msg.role !== "tool" || !Array.isArray(msg.content)) continue
    for (const part of msg.content) {
      if (
        part.type === "tool-result" &&
        truncateToolResultPart(part as unknown as { output: { type: string; value: unknown } }, tailChars)
      ) {
        count++
      }
    }
  }
  return count
}

// ─────────────────────────── buildContext 主入口 ───────────────────────────

/**
 * 上下文构建主入口：分区 → 摘要压缩（模型/降级）→ RAG 注入 → 组装
 *
 * 降级语义：
 * - 摘要模型调用失败（无 Key/网络）→ 滑动窗口占位提示
 * - knowledgeContext 缺省 → 不注入
 */
export async function buildContext(
  history: OpenAIMessage[],
  options: BuildContextOptions = {},
): Promise<BuiltContext> {
  const { system = "", knowledgeContext = "", budgetTokens = CONTEXT_WINDOW_BUDGET } = options
  const recentBudget =
    options.recentBudgetTokens ?? Math.floor(budgetTokens * RECENT_RATIO)

  const originalTokens = estimateContextTokens(history)
  const partition = partitionContext(history, { recentBudgetTokens: recentBudget })

  // 摘要压缩（超窗才触发；无 Key/失败 → 滑动窗口降级）
  let summary = ""
  let summaryMode: BuiltContext["meta"]["summaryMode"] = "none"
  if (partition.needsSummary) {
    try {
      summary = await summarizeWithModel(partition.older)
      summaryMode = "model"
    } catch {
      summary = slidingWindowFallback(partition.older)
      summaryMode = "sliding-window"
    }
  }

  // system 组装：原 system + 摘要 + RAG（各自带区块标注）
  const systemParts: string[] = []
  if (system) systemParts.push(system)
  if (summary) systemParts.push(`<conversation_summary>\n${summary}\n</conversation_summary>`)
  if (knowledgeContext) systemParts.push(knowledgeContext)
  const finalSystem = systemParts.join("\n\n")

  // messages 不含 system（system 经 generateText({ system }) 独立传入，避免重复注入）
  const messages: BuiltContext["messages"] = [...partition.recent]

  return {
    messages,
    system: finalSystem,
    meta: {
      originalTokens,
      compressedTokens: estimateContextTokens(messages) + estimateTokens(finalSystem),
      summarizedCount: partition.older.length,
      truncatedToolResults: 0,
      knowledgeInjected: Boolean(knowledgeContext),
      summaryMode,
    },
  }
}
