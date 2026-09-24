"use client"

/**
 * YYC³ NovaMind · 反馈标注后台（文档 06 · 资产 8）
 *
 * Dify Annotation 工作流：反馈列表 → 质检标注 → 知识库反哺筛选
 * - admin：全量反馈 + 标注回写（PATCH /api/feedback）
 * - 普通用户：仅本人反馈（GET 自动降级 scope=self）
 */
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface FeedbackItem {
  id: string
  messageId: string
  userId: string | null
  rating: "up" | "down"
  comment: string | null
  createdAt: string
}

export default function FeedbackAdminPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [scope, setScope] = useState<"all" | "self">("self")
  const [isAdmin, setIsAdmin] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<"all" | "up" | "down">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [annotatingId, setAnnotatingId] = useState<string | null>(null)
  const [annotationText, setAnnotationText] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (ratingFilter !== "all") params.set("rating", ratingFilter)
      const res = await fetch(`/api/feedback?${params.toString()}`)
      if (res.status === 503) {
        setError("持久化未启用：需配置 DATABASE_URL（见 07-生产供给配置手册）")
        return
      }
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = (await res.json()) as {
        items: FeedbackItem[]
        scope: "all" | "self"
      }
      setItems(data.items ?? [])
      setScope(data.scope ?? "self")
      setIsAdmin(data.scope === "all")
    } catch {
      setError("反馈列表加载失败")
    } finally {
      setIsLoading(false)
    }
  }, [ratingFilter, router])

  useEffect(() => {
    let cancelled = false
    load().finally(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const submitAnnotation = async (id: string) => {
    if (!annotationText.trim()) return
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, annotation: annotationText.trim() }),
    })
    if (res.ok) {
      setAnnotatingId(null)
      setAnnotationText("")
      load()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? "标注提交失败")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="返回">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">反馈标注后台</h1>
              <p className="text-sm text-gray-500">
                {isAdmin ? "admin 视角：全量反馈可标注" : "个人视角：仅显示本人反馈"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {(["all", "up", "down"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`rounded px-3 py-1 text-sm ${ratingFilter === r ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-600 dark:text-gray-300"}`}
              >
                {r === "all" ? "全部" : r === "up" ? "👍" : "👎"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            {error}
          </div>
        )}

        {/* 列表 */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>暂无反馈数据</p>
            <p className="mt-1 text-xs">对话中点击消息 👍/👎 后，反馈将在此聚合</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-white p-4 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.rating === "up" ? (
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-400">
                        {item.rating === "up" ? "正面" : "负面"} ·{" "}
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </span>
                      {scope === "all" && item.userId && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
                          {item.userId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    {item.comment && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.comment}</p>
                    )}
                    <p className="mt-1 truncate text-xs text-gray-400">msg: {item.messageId}</p>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAnnotatingId(annotatingId === item.id ? null : item.id)
                        setAnnotationText("")
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      标注
                    </Button>
                  )}
                </div>

                {/* 标注输入区 */}
                {annotatingId === item.id && (
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <input
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="标注结论，如 confirmed-good / false-positive / 需优化提示词"
                      className="flex-1 rounded-md border px-3 py-1.5 text-sm dark:bg-gray-800"
                      maxLength={2000}
                    />
                    <Button size="sm" onClick={() => submitAnnotation(item.id)}>
                      提交
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
