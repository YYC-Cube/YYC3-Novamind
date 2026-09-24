/**
 * YYC³ NovaMind · MCP 消费方（文档 06 · 资产 7 上半）
 *
 * 配置驱动接入外部 MCP server，工具自动并入资产 5 工具注册表：
 * - stdio：本地子进程（Node/Python server），仅限服务端使用
 * - http / sse：远程 Streamable HTTP，Next.js Route Handler / RSC 均可用
 *
 * 零成本禁用：MCP_SERVERS 缺失 → 返回空集，runAgent 行为与 Phase B 完全一致
 * 生态位：NovaMind 作为 MCP 消费方（供方见 app/api/mcp/route.ts）
 */
import { createMCPClient } from "@ai-sdk/mcp"
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio"
import type { Tool } from "ai"

/** MCP 动态工具（运行时 schema，开发期类型未知）— 对齐 AI SDK dynamic tool 语义 */
type DynamicTool = Tool & { type?: "dynamic" }

/** 单个 MCP server 配置（对齐 .env MCP_SERVERS JSON 数组元素） */
export interface MCPServerConfig {
  /** server 标识（工具名前缀，防多 server 冲突：`<server>__<tool>`） */
  name: string
  /** 传输类型：stdio 本地进程 / http Streamable HTTP / sse 兼容旧协议 */
  type: "stdio" | "http" | "sse"
  /** http/sse: 远端 URL；stdio: 可执行命令 */
  commandOrUrl: string
  /** stdio: 子进程参数 */
  args?: string[]
  /** stdio: 子进程环境变量 / http: 附加请求头（如 Authorization） */
  envOrHeaders?: Record<string, string>
  /** 连接/调用超时（毫秒，缺省 10s） */
  timeoutMs?: number
}

/** 解析 MCP_SERVERS 环境变量（JSON 数组；非法/缺失 → 空数组并告警） */
export function parseMCPServers(raw: string | undefined): MCPServerConfig[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error("not an array")
    return parsed.filter(
      (s): s is MCPServerConfig =>
        !!s &&
        typeof s === "object" &&
        typeof (s as MCPServerConfig).name === "string" &&
        typeof (s as MCPServerConfig).commandOrUrl === "string" &&
        ["stdio", "http", "sse"].includes((s as MCPServerConfig).type),
    )
  } catch {
    console.warn("MCP_SERVERS 环境变量非法（应为 JSON 数组），已忽略")
    return []
  }
}

/** 前缀化工具名 ↔ 还原调用：`<server>__<tool>` */
export const MCP_TOOL_PREFIX = "__"

export function prefixToolName(server: string, tool: string): string {
  return `${server}${MCP_TOOL_PREFIX}${tool}`
}

export function splitToolName(prefixed: string): { server: string; tool: string } | null {
  const idx = prefixed.indexOf(MCP_TOOL_PREFIX)
  if (idx <= 0 || idx === prefixed.length - MCP_TOOL_PREFIX.length) return null
  return { server: prefixed.slice(0, idx), tool: prefixed.slice(idx + MCP_TOOL_PREFIX.length) }
}

/** 单 server 接入结果 */
export interface MCPSession {
  config: MCPServerConfig
  /** AI SDK 工具集（键已加前缀，可直接并入 aiTools） */
  tools: Record<string, DynamicTool>
  close: () => Promise<void>
}

/** 接入单个 MCP server：建连 → 拉取工具集 */
export async function connectMCPServer(config: MCPServerConfig): Promise<MCPSession> {
  const client = await createMCPClient({
    transport:
      config.type === "stdio"
        ? new Experimental_StdioMCPTransport({
          command: config.commandOrUrl,
          args: config.args,
          env: config.envOrHeaders,
        })
        : {
          type: config.type,
          url: config.commandOrUrl,
          headers: config.envOrHeaders,
        },
  })

  const tools = await client.tools()

  // MCP 工具为运行时动态 schema（inputSchema: FlexibleSchema<unknown>），
  // AI SDK 归一化后与 Tool<any> 索引签名不兼容，此处受控断言为 dynamic 工具
  const prefixed: Record<string, DynamicTool> = {}
  for (const [name, toolDef] of Object.entries(tools)) {
    prefixed[prefixToolName(config.name, name)] = toolDef as DynamicTool
  }

  return {
    config,
    tools: prefixed,
    close: () => client.close(),
  }
}

/** 聚合所有已配置 server（单 server 失败不阻塞其余 — 高可用降级） */
export async function connectAllMCPServers(): Promise<{
  sessions: MCPSession[]
  tools: Record<string, DynamicTool>
  errors: { server: string; message: string }[]
}> {
  const configs = parseMCPServers(process.env.MCP_SERVERS)
  const sessions: MCPSession[] = []
  const errors: { server: string; message: string }[] = []

  for (const config of configs) {
    try {
      sessions.push(await connectMCPServer(config))
    } catch (error) {
      errors.push({
        server: config.name,
        message: error instanceof Error ? error.message : "未知错误",
      })
    }
  }

  const tools: Record<string, DynamicTool> = {}
  for (const s of sessions) Object.assign(tools, s.tools)

  return { sessions, tools, errors }
}
