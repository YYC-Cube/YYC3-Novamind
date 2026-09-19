/**
 * YYC³ NovaMind · Agentic 工具注册表（文档 06 · 资产 5）
 *
 * AI SDK v5 原生类型化工具：13 个现成 Zod schema 直接复用为入参定义
 * 六大能力工具化：思维导图 / 海报 / PPT / 学习路径 / 网页 / 知识检索（资产 6 挂点）
 *
 * Agent 循环：generateText({ tools, stopWhen: stepCountIs(N) }) — 外科手术式多步控制
 */
import { generateText, stepCountIs, tool } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { MindMapManager } from "@/lib/mindmap"
import { PosterGenerator } from "@/lib/poster-generator"
import { WebpageGenerator } from "@/lib/webpage-generator"
import { searchKnowledgeBase } from "@/lib/rag"

// ─────────────────────────── 工具定义 ───────────────────────────

/** 思维导图生成 — 入参语义对齐 MindMapManager.createMindMap */
export const mindmapTool = tool({
  description: "根据主题与内容大纲生成交互式思维导图，返回结构化节点树",
  inputSchema: z.object({
    title: z.string().min(1).max(100).describe("导图标题"),
    content: z.string().min(1).max(20_000).describe("内容大纲/原始文本"),
  }),
  execute: async ({ title, content }) => {
    const map = MindMapManager.createMindMap(title, content)
    return { id: map.id, nodeCount: map.nodes?.length ?? 0, title: map.title }
  },
})

/** 海报生成 — 入参对齐 PosterGenerator.generateFromQuery */
export const posterTool = tool({
  description: "根据文案查询生成海报（SVG），支持 modern/minimal/creative/business/education/tech 六种主题",
  inputSchema: z.object({
    query: z.string().min(1).max(2000).describe("海报文案/主题描述"),
    theme: z.enum(["modern", "minimal", "creative", "business", "education", "tech"]).default("modern"),
  }),
  execute: async ({ query, theme }) => {
    const poster = PosterGenerator.generateFromQuery(query, theme)
    return { id: poster.id, title: poster.config.title, format: "svg" }
  },
})

/** 网页生成 — 入参对齐 WebpageGenerator.generateAIContent + generateHTML */
export const webpageTool = tool({
  description: "根据需求描述生成单页网页（HTML），内置可选模板",
  inputSchema: z.object({
    prompt: z.string().min(1).max(10_000).describe("网页需求描述"),
    template: z.string().default("landing").describe("模板 ID，留空列出可用模板"),
  }),
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
  inputSchema: z.object({
    query: z.string().min(1).max(2000).describe("检索查询"),
    topK: z.number().int().min(1).max(20).default(5),
  }),
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

  const result = await generateText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o"),
    system:
      options.system ??
      "你是 NovaMind 智能助手。善用工具完成任务：结构化知识用 generateMindmap，视觉宣传用 generatePoster，网页需求用 generateWebpage，需要项目知识时先 searchKnowledge。回答使用中文。",
    prompt,
    tools: aiTools,
    stopWhen: stepCountIs(maxSteps),
    temperature,
  })

  return {
    text: result.text,
    toolCalls: result.steps.flatMap((step) =>
      step.toolCalls.map((tc) => ({ name: tc.toolName, args: tc.input })),
    ),
    steps: result.steps.length,
  }
}
