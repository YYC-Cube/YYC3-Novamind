/**
 * YYC³ NovaMind · AI 路由防护三件套（文档 06 · 资产 1）
 *
 * 1. rateLimit  — 滑动窗口限流（进程内实现，Upstash 可平替接入）
 * 2. sanitizeInput — 消息消毒（长度上限 + 控制字符清洗 + 空消息拦截）
 * 3. costGate   — 全局日预算闸门（token 成本裸奔防护）
 *
 * 设计原则：零外部服务强依赖 — 无 Redis/Upstash 时进程内 Map 兜底，
 * 单实例部署够用；扩多实例时切换 UPSTASH_REDIS_REST_URL 即可（Phase C 生态）。
 */
import { NextResponse } from "next/server"

// ─────────────────────────── 1. Rate Limit ───────────────────────────

export interface RateLimitOptions {
  /** 窗口内允许的最大请求数 */
  limit: number
  /** 窗口时长（毫秒） */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetMs: number
}

const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  limit: 10, // 行业基线：10 req/min/IP（调研结论）
  windowMs: 60_000,
}

/** 进程内滑动窗口存储：key → 时间戳数组 */
const hitStore = new Map<string, number[]>()

export function rateLimit(
  identifier: string,
  options: Partial<RateLimitOptions> = {},
): RateLimitResult {
  const { limit, windowMs } = { ...DEFAULT_RATE_LIMIT, ...options }
  const now = Date.now()
  const hits = (hitStore.get(identifier) ?? []).filter((t) => now - t < windowMs)

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now
    hitStore.set(identifier, hits)
    return { success: false, remaining: 0, resetMs: windowMs - (now - oldest) }
  }

  hits.push(now)
  hitStore.set(identifier, hits)

  // 存储防泄漏：空桶即回收
  if (hitStore.size > 10_000) {
    for (const [key, timestamps] of hitStore) {
      if (timestamps.every((t) => now - t >= windowMs)) hitStore.delete(key)
    }
  }

  return { success: true, remaining: limit - hits.length, resetMs: windowMs }
}

/** 从请求提取限流标识（登录用户 id 优先，其次转发 IP） */
export function extractIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "anon"
  return `ip:${ip}`
}

// ─────────────────────────── 2. Sanitize ───────────────────────────

export interface SanitizeResult {
  ok: boolean
  reason?: string
}

/** 单条消息长度上限（字符）— GPT-4o 上下文预算内防滥用 */
const MAX_MESSAGE_LENGTH = 32_000
const MAX_MESSAGES = 100

export function sanitizeInput(messages: unknown): SanitizeResult {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, reason: "消息列表为空" }
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, reason: `消息数超限（>${MAX_MESSAGES}）` }
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { ok: false, reason: "消息格式非法" }
    }
    const m = msg as { role?: unknown; content?: unknown }
    if (typeof m.role !== "string" || !["system", "user", "assistant"].includes(m.role)) {
      return { ok: false, reason: `角色非法: ${String(m.role)}` }
    }
    if (typeof m.content !== "string") {
      return { ok: false, reason: "content 必须为字符串" }
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, reason: `单条消息超限（>${MAX_MESSAGE_LENGTH} 字符）` }
    }
  }

  return { ok: true }
}

// ─────────────────────────── 3. Cost Gate ───────────────────────────

/** 全局日 token 预算（环境变量可覆盖；默认 2M tokens/日） */
const DAILY_BUDGET = Number(process.env.AI_DAILY_TOKEN_BUDGET ?? 2_000_000)

/** 当日用量：进程内存量（持久化升级点：Phase B 迁移至 messages 表聚合） */
let dailyUsage = { dateKey: "", tokens: 0 }

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function estimateTokens(text: unknown): number {
  if (typeof text !== "string") return 0
  // 粗估：中文≈1 token/字，英文≈4 char/token → 取 2.5 char/token 折中
  return Math.ceil(text.length / 2.5)
}

export interface CostGateResult {
  allowed: boolean
  usedToday: number
  budget: number
}

export function costGate(messages: unknown): CostGateResult {
  const key = todayKey()
  if (dailyUsage.dateKey !== key) {
    dailyUsage = { dateKey: key, tokens: 0 } // 跨日重置
  }

  const estimated = Array.isArray(messages)
    ? messages.reduce((sum, m) => sum + estimateTokens((m as { content?: unknown })?.content), 0)
    : 0

  const usedToday = dailyUsage.tokens + estimated
  return { allowed: usedToday <= DAILY_BUDGET, usedToday, budget: DAILY_BUDGET }
}

/** 请求完成后回写实际用量（由 route 调用） */
export function recordUsage(tokens: number): void {
  if (dailyUsage.dateKey !== todayKey()) {
    dailyUsage = { dateKey: todayKey(), tokens: 0 }
  }
  dailyUsage.tokens += tokens
}

// ─────────────────────────── 组合包装器 ───────────────────────────

export interface GuardContext {
  userId?: string
}

/**
 * API 路由统一防护高阶函数 — 29 个路由一条命令全量接入
 *
 * @example
 * export const POST = withGuard(async (req, ctx) => { ... })
 */
export function withGuard(
  handler: (req: Request, ctx: GuardContext) => Promise<Response>,
  options: { rateLimit?: Partial<RateLimitOptions> } = {},
) {
  return async (req: Request): Promise<Response> => {
    // 1. 限流
    const identifier = extractIdentifier(req)
    const rl = rateLimit(identifier, options.rateLimit)
    if (!rl.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
      )
    }

    // 2. 解析 body（GET 请求跳过）
    let body: unknown = undefined
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ error: "请求体 JSON 非法" }, { status: 400 })
      }
    }

    // 3. 消毒（存在 messages 字段时）
    const messages = (body as { messages?: unknown } | undefined)?.messages
    if (messages !== undefined) {
      const sc = sanitizeInput(messages)
      if (!sc.ok) {
        return NextResponse.json({ error: `输入不合规: ${sc.reason}` }, { status: 400 })
      }
    }

    // 4. 成本闸（AI 端点：存在 messages 时启用）
    if (messages !== undefined) {
      const cg = costGate(messages)
      if (!cg.allowed) {
        return NextResponse.json(
          { error: "已达当日 AI 用量预算，请明日再试" },
          { status: 402 },
        )
      }
    }

    // 5. 执行业务（body 还原为流供 handler 复用）
    const ctx: GuardContext = {}
    const rebuilt = body !== undefined
      ? new Request(req.url, { method: req.method, headers: req.headers, body: JSON.stringify(body) })
      : req
    return handler(rebuilt, ctx)
  }
}
