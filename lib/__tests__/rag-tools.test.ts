import { describe, expect, it } from "vitest"
import { chunkText } from "../rag"
import { aiTools } from "../ai-tools"

describe("rag · chunkText 分块策略", () => {
  it("短文本不分块", () => {
    const text = "短内容"
    expect(chunkText(text)).toEqual([text])
  })

  it("长文本滑动窗口分块且含重叠", () => {
    const text = "x".repeat(3000) // CHUNK_SIZE=1200 → 约 3 块
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
    // 重叠校验：第 2 块开头应含第 1 块结尾的 120 字符重叠
    expect(chunks[1]?.startsWith("x".repeat(50))).toBe(true)
    // 无丢失：拼接覆盖全文本长度
    const covered = (chunks[0]?.length ?? 0) + chunks.slice(1).reduce((s, c) => s + (c.length - 120), 0)
    expect(covered).toBeGreaterThanOrEqual(3000 - 120)
  })

  it("空文本返回单块", () => {
    expect(chunkText("")).toEqual([""])
  })
})

describe("ai-tools · 工具注册表结构", () => {
  it("六大能力工具全部注册且含描述与入参 schema", () => {
    const names = Object.keys(aiTools)
    expect(names).toContain("generateMindmap")
    expect(names).toContain("generatePoster")
    expect(names).toContain("generateWebpage")
    expect(names).toContain("searchKnowledge")
    for (const name of names) {
      const t = aiTools[name as keyof typeof aiTools] as { description?: string }
      expect(t.description, `${name} 缺 description`).toBeTruthy()
    }
  })
})
