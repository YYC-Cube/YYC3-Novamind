/**
 * YYC³ NovaMind · 反馈闭环 API（文档 06 · 资产 8）
 *
 * Dify Annotation 模式落地：消息级 👍/👎 + 评论 → feedback 表 → 标注后台消费
 * - POST /api/feedback          提交反馈（登录用户；middleware 已有会话闸门）
 * - GET  /api/feedback          反馈列表（admin 全量 / 普通用户本人）
 * - PATCH /api/feedback         admin 标注（annotation 质检结论回写）
 *
 * DSN 驱动降级：DATABASE_URL 缺失 → 503 明确提示（持久化能力以生产 DB 供给为前提）
 */
import { withGuard } from "@/lib/api-guard"
import { getDb, isDbEnabled } from "@/lib/db"
import { feedback, messages } from "@/lib/db/schema"
import { auth } from "@/auth.config"
import { and, desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

/** POST 入参契约（messageId + rating 必填，comment 可选） */
const FeedbackCreateSchema = z.object({
  messageId: z.string().uuid("messageId 须为合法 UUID"),
  rating: z.enum(["up", "down"]),
  comment: z.string().max(2000).optional(),
})

/** PATCH 入参契约（admin 标注） */
const FeedbackAnnotateSchema = z.object({
  id: z.string().uuid(),
  annotation: z.string().max(2000).describe("质检标注结论，如 confirmed-good / false-positive"),
})

/** @openapi
 * 提交消息级反馈
 * @desc 👍/👎 + 评论写入 feedback 表（存在同消息同人反馈则覆盖更新）
 * @body FeedbackCreate
 * @response ApiEnvelope
 */
export const POST = withGuard(async (request) => {
  if (!isDbEnabled) {
    return NextResponse.json(
      { error: "持久化未启用：需配置 DATABASE_URL（见 docs/07-生产供给配置手册.md）" },
      { status: 503 },
    )
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const parsed = FeedbackCreateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入参校验失败", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }

  const db = getDb()
  const { messageId, rating, comment } = parsed.data

  // messageId 合法性校验（防外键裸异常）
  const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1)
  if (!message) {
    return NextResponse.json({ error: "消息不存在" }, { status: 404 })
  }

  // 幂等：同人同消息 → 更新评分而非重复插入
  const existing = await db
    .select()
    .from(feedback)
    .where(and(eq(feedback.messageId, messageId), eq(feedback.userId, session.user.id ?? "")))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(feedback)
      .set({ rating, comment })
      .where(eq(feedback.id, existing[0]!.id))
    return NextResponse.json({ ok: true, id: existing[0]!.id, updated: true })
  }

  const [row] = await db
    .insert(feedback)
    .values({ messageId, userId: session.user.id, rating, comment })
    .returning()

  return NextResponse.json({ ok: true, id: row?.id, updated: false }, { status: 201 })
})

/** @openapi
 * 反馈列表查询
 * @desc admin 全量（可按 rating 过滤）；普通用户仅见本人反馈
 * @response FeedbackListResponse
 */
export async function GET(request: Request) {
  if (!isDbEnabled) {
    return NextResponse.json({ error: "持久化未启用" }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const role = (session.user as { role?: string }).role ?? "user"
  const url = new URL(request.url)
  const ratingFilter = url.searchParams.get("rating")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200)

  const db = getDb()
  const conditions = []
  if (role !== "admin") conditions.push(eq(feedback.userId, session.user.id ?? ""))
  if (ratingFilter === "up" || ratingFilter === "down") {
    conditions.push(eq(feedback.rating, ratingFilter))
  }

  const rows = await db
    .select()
    .from(feedback)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(feedback.createdAt))
    .limit(limit)

  return NextResponse.json({
    items: rows,
    total: rows.length,
    scope: role === "admin" ? "all" : "self",
  })
}

/** @openapi
 * 反馈标注（admin 专用）
 * @desc 标注结论回写 feedback.comment 前缀区，供质量看板与知识库反哺筛选
 * @body FeedbackAnnotate
 * @response ApiEnvelope
 */
export async function PATCH(request: Request) {
  if (!isDbEnabled) {
    return NextResponse.json({ error: "持久化未启用" }, { status: 503 })
  }

  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user"
  if (role !== "admin") {
    return NextResponse.json({ error: "需要 admin 角色" }, { status: 403 })
  }

  const parsed = FeedbackAnnotateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入参校验失败", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }

  const db = getDb()
  const [updated] = await db
    .update(feedback)
    .set({ comment: `[标注] ${parsed.data.annotation}` })
    .where(eq(feedback.id, parsed.data.id))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "反馈不存在" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, item: updated })
}
