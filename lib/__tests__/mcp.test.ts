import { describe, expect, it } from "vitest"
import {
  MCP_TOOL_PREFIX,
  parseMCPServers,
  prefixToolName,
  splitToolName,
} from "../mcp/client"
import { aiToolSchemas } from "../ai-tools"
import { zodToJsonSchema } from "zod-to-json-schema"

describe("mcp/client · 配置解析", () => {
  it("缺失/空白环境变量 → 空数组（零成本禁用）", () => {
    expect(parseMCPServers(undefined)).toEqual([])
    expect(parseMCPServers("")).toEqual([])
    expect(parseMCPServers("   ")).toEqual([])
  })

  it("非法 JSON / 非数组 → 空数组不抛异常", () => {
    expect(parseMCPServers("{not json")).toEqual([])
    expect(parseMCPServers('{"name":"x"}')).toEqual([])
  })

  it("合法配置解析出 stdio + http 双通道", () => {
    const raw = JSON.stringify([
      { name: "fs", type: "stdio", commandOrUrl: "npx", args: ["-y", "server-fs"] },
      { name: "search", type: "http", commandOrUrl: "https://mcp.example.com/mcp" },
    ])
    const servers = parseMCPServers(raw)
    expect(servers).toHaveLength(2)
    expect(servers[0]).toMatchObject({ name: "fs", type: "stdio" })
    expect(servers[1]).toMatchObject({ name: "search", type: "http" })
  })

  it("条目缺关键字段被过滤（type/name/commandOrUrl 非法）", () => {
    const raw = JSON.stringify([
      { name: "bad", type: "websocket", commandOrUrl: "x" },
      { type: "http", commandOrUrl: "https://x" },
      { name: "ok", type: "sse", commandOrUrl: "https://x/sse" },
    ])
    const servers = parseMCPServers(raw)
    expect(servers).toHaveLength(1)
    expect(servers[0]?.name).toBe("ok")
  })
})

describe("mcp/client · 工具名前缀化", () => {
  it("前缀拼接与还原对称", () => {
    const prefixed = prefixToolName("fs", "read_file")
    expect(prefixed).toBe(`fs${MCP_TOOL_PREFIX}read_file`)
    expect(splitToolName(prefixed)).toEqual({ server: "fs", tool: "read_file" })
  })

  it("无前缀/空前缀名返回 null", () => {
    expect(splitToolName("read_file")).toBeNull()
    expect(splitToolName(`${MCP_TOOL_PREFIX}read_file`)).toBeNull()
  })
})

describe("mcp 供方 · schema 导出（tools/list 契约）", () => {
  it("四工具 Zod schema 均可转 JSON Schema（object 含 properties）", () => {
    for (const [name, schema] of Object.entries(aiToolSchemas)) {
      const json = zodToJsonSchema(schema, { $refStrategy: "none" }) as {
        type?: string
        properties?: Record<string, unknown>
      }
      expect(json.type, `${name} 导出非 object`).toBe("object")
      expect(Object.keys(json.properties ?? {}).length, `${name} 无 properties`).toBeGreaterThan(0)
    }
  })
})
