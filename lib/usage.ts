/**
 * YYC³ NovaMind · 成本/Token 观测层（文档 06 · Phase D 资产 9）
 *
 * Dify 内建成本追踪的对标落地：模型调用级用量持久化 + 多维聚合 + 定价折算。
 * - recordTokenUsage：chat/stream/runAgent 统一旁挂记录（DSN 驱动降级：无 DB 静默跳过）
 * - getUsageSummary：按用户/模型/日聚合（admin 看板数据源）
 * - MODEL_PRICING：可选定价常量 → token 折算美元成本
 *
 * 与资产 1 分工：costGate 内存日预算负责边缘快速拒绝，本层负责事后审计与配额演进基座。
 */
import { getDb, isDbEnabled } from "@/lib/db"
import { usageLogs } from "@/lib/db/schema"
import { and, desc, gte, sql } from "drizzle-orm"

/** 单次调用用量记录入参 */
export interface TokenUsageRecord {
  userId?: string | null
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  /** 端到端延迟（毫秒，可选） */
  latencyMs?: number
}

/** UTC 日期键（yyyy-mm-dd），与 usage_logs.usage_date 冗余列一致 */
export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** 记录一次模型调用用量（无 DB 静默跳过 — 保持资产级降级语义；不抛错不阻塞主链路） */
export async function recordTokenUsage(record: TokenUsageRecord): Promise<boolean> {
  if (!isDbEnabled) return false
  try {
    const db = getDb()
    await db.insert(usageLogs).values({
      userId: record.userId ?? null,
      provider: record.provider,
      model: record.model,
      inputTokens: Math.max(0, Math.trunc(record.inputTokens) || 0),
      outputTokens: Math.max(0, Math.trunc(record.outputTokens) || 0),
      latencyMs: record.latencyMs != null ? Math.max(0, Math.trunc(record.latencyMs)) : null,
      usageDate: utcDateKey(),
    })
    return true
  } catch (error) {
    // 观测失败不阻塞业务：告警式吞没
    console.error("[usage] 用量记录失败:", error)
    return false
  }
}

/** 聚合维度 */
export type UsageGroupBy = "user" | "model" | "day"

/** 聚合行结构 */
export interface UsageSummaryRow {
  groupKey: string
  provider: string
  model: string
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  /** 折算美元成本（MODEL_PRICING 未命中模型按 0 计） */
  costUsd: number
  /** 平均延迟（毫秒，无样本时 null） */
  avgLatencyMs: number | null
}

/** 查询范围（天数，自今日往前推，含今日；缺省 30） */
export interface UsageQueryOptions {
  days?: number
  groupBy?: UsageGroupBy
  userId?: string
}

/** 模型定价（USD / 1M tokens，input/output）；未列出的模型按 0 折算 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "o3-mini": { input: 1.1, output: 4.4 },
}

/** token → USD 折算（未知模型返回 0） */
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

/** 用量聚合查询（admin 看板数据源；无 DB 返回空集并标注降级） */
export async function getUsageSummary(
  options: UsageQueryOptions = {},
): Promise<{ degraded: false; rows: UsageSummaryRow[] } | { degraded: true; rows: [] }> {
  if (!isDbEnabled) return { degraded: true, rows: [] }

  const { days = 30, groupBy = "day", userId } = options
  const since = new Date(Date.now() - (days - 1) * 86_400_000)
  const sinceKey = utcDateKey(since)

  const db = getDb()
  const conditions = [gte(usageLogs.usageDate, sinceKey)]
  if (userId) conditions.push(sql`${usageLogs.userId} = ${userId}`)

  const groupExpr =
    groupBy === "user"
      ? sql<string>`coalesce(${usageLogs.userId}::text, 'anonymous')`
      : groupBy === "model"
        ? sql<string>`${usageLogs.model}`
        : sql<string>`${usageLogs.usageDate}`

  const rows = await db
    .select({
      groupKey: groupExpr,
      provider: sql<string>`min(${usageLogs.provider})`,
      model: sql<string>`min(${usageLogs.model})`,
      calls: sql<number>`count(*)::int`,
      inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)::int`,
      avgLatencyMs: sql<number | null>`avg(${usageLogs.latencyMs})::int`,
    })
    .from(usageLogs)
    .where(and(...conditions))
    .groupBy(groupExpr)
    .orderBy(desc(sql`max(${usageLogs.createdAt})`))
    .limit(500)

  return {
    degraded: false,
    rows: rows.map((r) => ({
      ...r,
      totalTokens: r.inputTokens + r.outputTokens,
      costUsd: Number(estimateCostUsd(r.model, r.inputTokens, r.outputTokens).toFixed(6)),
      avgLatencyMs: r.avgLatencyMs ?? null,
    })),
  }
}
