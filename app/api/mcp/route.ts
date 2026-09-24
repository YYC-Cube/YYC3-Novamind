/**
 * YYC³ NovaMind · MCP 供方端点（文档 06 · 资产 7 下半）
 *
 * Streamable HTTP 传输的 JSON-RPC 2.0 极简实现，仅覆盖工具能力域：
 *   initialize → tools/list → tools/call（+ notifications/initialized 通知吞没）
 *
 * 生态位反转：NovaMind 四大能力（思维导图/海报/网页/知识检索）反向暴露，
 * 任何 MCP host（Claude Desktop / Cursor / 自建 Agent）皆可将其作为工具调用。
 * 防护复用资产 1 withGuard（限流 + 消毒 + 成本闸）。
 */
import { aiToolSchemas, aiTools } from "@/lib/ai-tools"
import { withGuard } from "@/lib/api-guard"
import { NextResponse } from "next/server"
import { zodToJsonSchema } from "zod-to-json-schema"

/** MCP 协议版本（2025-03-26 起 Streamable HTTP 为推荐传输） */
const PROTOCOL_VERSION = "2025-03-26"
const SERVER_INFO = { name: "yyc3-novamind", version: "1.0.0" }

/** JSON-RPC 2.0 响应构造 */
function rpcResult(id: unknown, result: Record<string, unknown>) {
  return NextResponse.json({ jsonrpc: "2.0", id, result })
}

function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } })
}

/** 工具清单 → MCP tools/list 载荷（Zod schema 转 JSON Schema） */
function listToolsPayload() {
  return Object.entries(aiTools).map(([name, t]) => ({
    name,
    description: t.description,
    inputSchema: zodToJsonSchema(aiToolSchemas[name as keyof typeof aiToolSchemas], {
      $refStrategy: "none",
    }),
  }))
}

/** 工具执行 → MCP CallToolResult（text 内容块约定） */
async function callToolPayload(name: string, args: unknown) {
  const target = aiTools[name as keyof typeof aiTools]
  if (!target) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `未知工具: ${name}` }],
    }
  }

  const parsed = aiToolSchemas[name as keyof typeof aiToolSchemas].safeParse(args)
  if (!parsed.success) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `入参校验失败: ${parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        },
      ],
    }
  }

  try {
    // MCP 分发点：name 来自远端请求，schema 已按 name 选取，此处断言收敛联合类型
    const execute = target.execute as
      | ((input: unknown, options: { toolCallId: string; messages: never[] }) => Promise<unknown>)
      | undefined
    if (!execute) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `工具 ${name} 不可执行` }],
      }
    }
    const output = await execute(parsed.data, {
      toolCallId: `mcp-${crypto.randomUUID()}`,
      messages: [],
    })
    return {
      isError: false,
      content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : "工具执行失败",
        },
      ],
    }
  }
}

/** @openapi
 * MCP 供方端点（Streamable HTTP）
 * @desc JSON-RPC 2.0：initialize / tools/list / tools/call；暴露 NovaMind 四工具
 * @response McpRpcResponse
 */
export const POST = withGuard(async (request: Request) => {
  let message: {
    jsonrpc?: string
    id?: unknown
    method?: string
    params?: Record<string, unknown>
  }
  try {
    message = await request.json()
  } catch {
    return rpcError(null, -32700, "Parse error")
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request")
  }

  const isNotification = message.id === undefined || message.id === null

  switch (message.method) {
    // 生命周期握手
    case "initialize":
      return rpcResult(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      })

    // 客户端初始化完成通知（吞没即可）
    case "notifications/initialized":
      return new NextResponse(null, { status: 202 })

    case "tools/list":
      return rpcResult(message.id, { tools: listToolsPayload() })

    case "tools/call": {
      const name = message.params?.name
      if (typeof name !== "string") {
        return rpcError(message.id ?? null, -32602, "tools/call 缺少 name 参数")
      }
      if (isNotification) {
        return rpcError(null, -32600, "tools/call 不允许作为通知发送")
      }
      const result = await callToolPayload(name, message.params?.arguments)
      return rpcResult(message.id, result)
    }

    // ping（协议探活）
    case "ping":
      return rpcResult(message.id, {})

    default:
      // 通知型未知方法静默吞没；请求型返回方法不存在
      return isNotification
        ? new NextResponse(null, { status: 202 })
        : rpcError(message.id, -32601, `Method not found: ${message.method}`)
  }
})

/** GET：Streamable HTTP 可选 SSE 流；当前为无状态实现，明确拒绝引导客户端走 POST */
export async function GET() {
  return NextResponse.json(
    { error: "SSE streaming not supported; use POST (stateless JSON-RPC)" },
    { status: 405 },
  )
}

/** DELETE：会话终止（无状态实现直接 204 确认） */
export async function DELETE() {
  return new NextResponse(null, { status: 204 })
}
