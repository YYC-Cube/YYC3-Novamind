/**
 * YYC³ NovaMind · 用量查询 API（文档 06 · Phase D 资产 9）
 *
 * GET /api/usage?days=30&groupBy=day|user|model&scope=self
 * - admin：默认全量，scope=self 可切本人视角
 * - 普通用户：强制本人视角（userId 过滤）
 * - 无 DB：503 明确提示（对齐 feedback 路由降级语义）
 */
import { withGuard } from "@/lib/api-guard"
import { auth } from "@/auth.config"
import { getUsageSummary, type UsageGroupBy } from "@/lib/usage"
import { NextResponse } from "next/server"

/** @openapi
 * 用量聚合查询（admin 全量 / 普通用户本人）
 * @desc Token 用量按用户/模型/日聚合，附定价折算美元成本；无 DB 时 503
 * @response UsageSummaryResponse
 */
export const GET = withGuard(async (request: Request) => {
  if (!(await import("@/lib/db")).isDbEnabled) {
    return NextResponse.json(
      { error: "持久化未启用：需配置 DATABASE_URL（见 docs/07-生产供给配置手册.md）" },
      { status: 503 },
    )
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const url = new URL(request.url)
  const role = (session.user as { role?: string }).role ?? "user"
  const isAdmin = role === "admin"

  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 30) || 30, 1), 365)
  const groupByParam = url.searchParams.get("groupBy")
  const groupBy: UsageGroupBy =
    groupByParam === "user" || groupByParam === "model" || groupByParam === "day"
      ? groupByParam
      : "day"
  const scopeSelf = url.searchParams.get("scope") === "self" || !isAdmin

  // userId 必须是合法 UUID（Auth.js 演示账户 id 非库内 uuid，传给 SQL 会 500）
  const rawUserId = session.user.id ?? ""
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId)

  const summary = await getUsageSummary({
    days,
    groupBy,
    userId: scopeSelf && isUuid ? rawUserId : undefined,
  })

  return NextResponse.json({
    ...summary,
    days,
    groupBy,
    scope: scopeSelf ? "self" : "all",
  })
})
