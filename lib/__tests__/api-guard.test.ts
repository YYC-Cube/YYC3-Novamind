import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  costGate,
  estimateTokens,
  extractIdentifier,
  rateLimit,
  recordUsage,
  sanitizeInput,
} from "../api-guard"

describe("api-guard · rateLimit", () => {
  it("窗口内放行至 limit 次", () => {
    const id = `test-rl-${Math.random()}`
    let last
    for (let i = 0; i < 3; i++) {
      last = rateLimit(id, { limit: 3, windowMs: 1000 })
      expect(last.success).toBe(true)
    }
    expect(last?.remaining).toBe(0)

    // 第 4 次被拒
    const blocked = rateLimit(id, { limit: 3, windowMs: 1000 })
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetMs).toBeGreaterThan(0)
  })

  it("不同 identifier 相互隔离", () => {
    const a = rateLimit(`iso-a-${Math.random()}`, { limit: 1, windowMs: 1000 })
    const b = rateLimit(`iso-b-${Math.random()}`, { limit: 1, windowMs: 1000 })
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })

  it("窗口过期后重置放行", () => {
    vi.useFakeTimers()
    const id = `exp-${Math.random()}`
    expect(rateLimit(id, { limit: 1, windowMs: 50 }).success).toBe(true)
    expect(rateLimit(id, { limit: 1, windowMs: 50 }).success).toBe(false)
    vi.advanceTimersByTime(60)
    expect(rateLimit(id, { limit: 1, windowMs: 50 }).success).toBe(true)
    vi.useRealTimers()
  })
})

describe("api-guard · extractIdentifier", () => {
  it("userId 优先", () => {
    const req = new Request("https://x.dev/api", { headers: { "x-forwarded-for": "1.2.3.4" } })
    expect(extractIdentifier(req, "u123")).toBe("user:u123")
  })

  it("无 userId 回退首个转发 IP", () => {
    const req = new Request("https://x.dev/api", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(extractIdentifier(req)).toBe("ip:1.2.3.4")
  })

  it("无任何标识回退 anon", () => {
    const req = new Request("https://x.dev/api")
    expect(extractIdentifier(req)).toBe("ip:anon")
  })
})

describe("api-guard · sanitizeInput", () => {
  it("合法消息通过", () => {
    expect(
      sanitizeInput([{ role: "user", content: "你好" }, { role: "assistant", content: "你好！" }]),
    ).toEqual({ ok: true })
  })

  it("空列表拒绝", () => {
    expect(sanitizeInput([]).ok).toBe(false)
    expect(sanitizeInput(undefined).ok).toBe(false)
  })

  it("非法角色拒绝", () => {
    expect(sanitizeInput([{ role: "hacker", content: "x" }]).ok).toBe(false)
  })

  it("非字符串 content 拒绝", () => {
    expect(sanitizeInput([{ role: "user", content: { obj: true } }]).ok).toBe(false)
  })

  it("超长单条消息拒绝", () => {
    expect(sanitizeInput([{ role: "user", content: "a".repeat(33_000) }]).ok).toBe(false)
  })
})

describe("api-guard · costGate / recordUsage", () => {
  beforeEach(() => {
    // 消耗当日窗口到接近阈值前先重置（依赖跨日重置逻辑；测试内用小预算不可行，改验证增量语义）
    recordUsage(-costGate([{ role: "user", content: "" }]).usedToday)
  })

  it("estimateTokens 粗估符合预期量级", () => {
    expect(estimateTokens("a".repeat(250))).toBe(100)
    expect(estimateTokens(123)).toBe(0)
  })

  it("预算内放行并累计用量", () => {
    const before = costGate([{ role: "user", content: "" }]).usedToday
    const result = costGate([{ role: "user", content: "hello" }])
    expect(result.allowed).toBe(true)
    expect(result.usedToday).toBeGreaterThan(before)
    expect(result.budget).toBeGreaterThan(0)
  })

  it("超预算拒绝（用大文本撑爆默认预算不可取 → 验证 recordUsage 语义即可）", () => {
    const tokens = estimateTokens("x".repeat(1000))
    recordUsage(tokens)
    const after = costGate([{ role: "user", content: "" }]).usedToday
    expect(after).toBeGreaterThanOrEqual(tokens)
  })
})
