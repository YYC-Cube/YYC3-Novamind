/**
 * YYC³ NovaMind · Agentic 工具注册表（文档 06 · 资产 5）
 *
 * AI SDK v5 原生类型化工具：13 个现成 Zod schema 直接复用为入参定义
 * 六大能力工具化：思维导图 / 海报 / PPT / 学习路径 / 网页 / 知识检索（资产 6 挂点）
 *
 * Agent 循环：generateText({ tools, stopWhen: stepCountIs(N) }) — 外科手术式多步控制
 */
import { auth } from "@/auth.config"
import { formatKnowledgeContext, truncateToolResults } from "@/lib/context-engine"
import { MindMapManager } from "@/lib/mindmap"
import { PosterGenerator } from "@/lib/poster-generator"
import { searchKnowledgeBase } from "@/lib/rag"
import { recordTokenUsage } from "@/lib/usage"
import { WebpageGenerator } from "@/lib/webpage-generator"
import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs, tool } from "ai"
import { z } from "zod"

/** Agent 默认 system 提示词（资产 5 原文抽常量，供 RAG 注入拼接） */
export const DEFAULT_AGENT_SYSTEM =
  "你是 NovaMind 智能助手。善用工具完成任务：结构化知识用 generateMindmap，视觉宣传用 generatePoster，网页需求用 generateWebpage，需要项目知识时先 searchKnowledge。回答使用中文。"

// ─────────────────────────── 入参 Schema 注册表 ───────────────────────────
// 单一事实源：tool() 定义 / MCP 供方（app/api/mcp/route.ts）共用原始 Zod schema

export const aiToolSchemas = {
  generateMindmap: z.object({
    title: z.string().min(1).max(100).describe("导图标题"),
    content: z.string().min(1).max(20_000).describe("内容大纲/原始文本"),
  }),
  generatePoster: z.object({
    query: z.string().min(1).max(2000).describe("海报文案/主题描述"),
    theme: z.enum(["modern", "minimal", "creative", "business", "education", "tech"]).default("modern"),
  }),
  generateWebpage: z.object({
    prompt: z.string().min(1).max(10_000).describe("网页需求描述"),
    template: z.string().default("landing").describe("模板 ID，留空列出可用模板"),
  }),
  searchKnowledge: z.object({
    query: z.string().min(1).max(2000).describe("检索查询"),
    topK: z.number().int().min(1).max(20).default(5),
  }),
}

// ─────────────────────────── 工具定义 ───────────────────────────

/** 思维导图生成 — 入参语义对齐 MindMapManager.createMindMap */
export const mindmapTool = tool({
  description: "根据主题与内容大纲生成交互式思维导图，返回结构化节点树",
  inputSchema: aiToolSchemas.generateMindmap,
  execute: async ({ title, content }) => {
    const map = MindMapManager.createMindMap(title, content)
    return { id: map.id, nodeCount: map.nodes?.length ?? 0, title: map.title }
  },
})

/** 海报生成 — 入参对齐 PosterGenerator.generateFromQuery */
export const posterTool = tool({
  description: "根据文案查询生成海报（SVG），支持 modern/minimal/creative/business/education/tech 六种主题",
  inputSchema: aiToolSchemas.generatePoster,
  execute: async ({ query, theme }) => {
    const poster = PosterGenerator.generateFromQuery(query, theme)
    return { id: poster.id, title: poster.config.title, format: "svg" }
  },
})

/** 网页生成 — 入参对齐 WebpageGenerator.generateAIContent + generateHTML */
export const webpageTool = tool({
  description: "根据需求描述生成单页网页（HTML），内置可选模板",
  inputSchema: aiToolSchemas.generateWebpage,
  execute: async ({ prompt, template }) => {
    const templates = WebpageGenerator.getTemplates()
    const tpl = templates.find((t) => t.id === template)?.id ?? templates[0]?.id ?? "landing"
    const content = await WebpageGenerator.generateAIContent(prompt, tpl)
    return { template: tpl, sections: Object.keys(content ?? {}).length }
  },
})

/** 知识库检索 — 资产 6 RAG 挂点（DSN 驱动：无 DB 时返回明确降级提示） */
export const knowledgeSearchTool = tool({
  description: "在项目知识库中语义+关键词混合检索相关文档片段",
  inputSchema: aiToolSchemas.searchKnowledge,
  execute: async ({ query, topK }) => {
    const result = await searchKnowledgeBase(query, topK)
    return result
  },
})

/** 工具注册表 — Agent 循环的 tools 入参；MCP 接入（资产 7）将自动并入 */
export const aiTools = {
  generateMindmap: mindmapTool,
  generatePoster: posterTool,
  generateWebpage: webpageTool,
  searchKnowledge: knowledgeSearchTool,
}

export type AiToolName = keyof typeof aiTools

// ─────────────────────────── MCP 消费方并入（文档 06 · 资产 7）───────────────────────────

export interface AgentToolset {
  tools: Record<string, unknown>
  /** MCP 会话句柄：generateText 结束后需逐个 close（stdio 子进程/HTTP 会话） */
  closeAll: () => Promise<void>
  /** 接入失败的 server 清单（部分失败不阻塞 Agent 主流程） */
  mcpErrors: { server: string; message: string }[]
}

/** 内置工具 + MCP 外部工具的合并工具集（MCP_SERVERS 未配置时零开销直通） */
export async function buildAgentToolset(): Promise<AgentToolset> {
  const { connectAllMCPServers } = await import("@/lib/mcp/client")
  const { sessions, tools, errors } = await connectAllMCPServers()
  return {
    tools: { ...aiTools, ...tools },
    closeAll: async () => {
      for (const s of sessions) {
        try {
          await s.close()
        } catch (e) {
          console.warn(`MCP 会话关闭失败 (${s.config.name}):`, e)
        }
      }
    },
    mcpErrors: errors,
  }
}

// ─────────────────────────── Agent 循环 ───────────────────────────

export interface AgentRunResult {
  text: string
  toolCalls: { name: string; args: unknown }[]
  steps: number
}

/**
 * Agentic 循环执行器 — 多步工具调用的统一入口
 *
 * @example
 * const r = await runAgent("帮我生成一张关于云原生的海报并建思维导图")
 * // r.toolCalls → [{ name: "generatePoster", ... }, { name: "generateMindmap", ... }]
 */
export async function runAgent(
  prompt: string,
  options: { maxSteps?: number; temperature?: number; system?: string } = {},
): Promise<AgentRunResult> {
  const { maxSteps = 5, temperature = 0.7 } = options
  const agentStart = Date.now()

  // MCP 外部工具并入（MCP_SERVERS 缺失时直通内置四工具）
  const toolset = await buildAgentToolset()

  // 资产 10：RAG 知识注入（DSN 驱动降级 — 无 DB/未命中时 system 不变）
  let system = options.system ?? DEFAULT_AGENT_SYSTEM
  try {
    const { chunks, degraded } = await searchKnowledgeBase(prompt, 3)
    if (!degraded && chunks.length > 0) {
      system = `${system}\n\n${formatKnowledgeContext(chunks)}`
    }
  } catch (e) {
    console.warn("[agent] RAG 注入失败（跳过）:", e)
  }

  try {
    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o"),
      system,
      prompt,
      tools: toolset.tools as typeof aiTools,
      stopWhen: stepCountIs(maxSteps),
      temperature,
      // 资产 10：每步动态裁剪超长工具结果（截头保尾，尾部含最新执行上下文）
      prepareStep: ({ messages }) => {
        const trimmed = truncateToolResults(messages)
        return trimmed > 0 ? { messages } : undefined
      },
    })

    // 资产 9：Agent 用量持久化（多步聚合为一条记录，旁挂失败静默）
    const session = await auth()
    await recordTokenUsage({
      userId: session?.user?.id ?? null,
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      latencyMs: Date.now() - agentStart,
    })

    return {
      text: result.text,
      toolCalls: result.steps.flatMap((step) =>
        step.toolCalls.map((tc) => ({ name: tc.toolName, args: tc.input })),
      ),
      steps: result.steps.length,
    }
  } finally {
    await toolset.closeAll()
  }
}
