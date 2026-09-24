"use client"

/**
 * YYC³ NovaMind · 用量看板（文档 06 · Phase D 资产 9）
 *
 * Token 成本可视化：按日/用户/模型三维聚合 + 定价折算美元
 * - admin：全量视角（可切本人）；普通用户：仅本人
 * - 数据源 GET /api/usage（无 DB 显示降级提示）
 */
import { SummaryCard } from "@/components/summary-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface UsageRow {
  groupKey: string
  provider: string
  model: string
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  avgLatencyMs: number | null
}

type GroupBy = "day" | "user" | "model"

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function UsageDashboardPage() {
  const router = useRouter()
  const [rows, setRows] = useState<UsageRow[]>([])
  const [degraded, setDegraded] = useState(false)
  const [scope, setScope] = useState<"all" | "self">("self")
  const [groupBy, setGroupBy] = useState<GroupBy>("day")
  const [days, setDays] = useState(30)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ days: String(days), groupBy })
      if (scope === "self") params.set("scope", "self")
      const res = await fetch(`/api/usage?${params.toString()}`)
      if (res.status === 503) {
        setDegraded(true)
        setIsLoading(false)
        return
      }
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = (await res.json()) as {
        rows: UsageRow[]
        degraded: boolean
        scope: "all" | "self"
      }
      setRows(data.rows ?? [])
      setDegraded(data.degraded)
      setScope(data.scope ?? "self")
    } catch {
      setError("用量数据加载失败")
      setIsLoading(false)
    }
  }, [days, groupBy, scope, router])

  useEffect(() => {
    let cancelled = false
    // 异步加载：setState 均在 fetch 回调（微任务）中触发，非 effect 同步调用
    void Promise.resolve().then(() => {
      if (cancelled) return
      void load()
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const totalTokens = rows.reduce((s, r) => s + r.totalTokens, 0)
  const totalCost = rows.reduce((s, r) => s + r.costUsd, 0)
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0)
  // sparkline 趋势（归一化 0~1，取最近 12 组，聚合维度变化时随 rows 更新）
  const maxCalls = Math.max(1, ...rows.map((r) => r.calls))
  const maxTokens = Math.max(1, ...rows.map((r) => r.totalTokens))
  const maxCost = Math.max(0.0001, ...rows.map((r) => r.costUsd))
  const callTrend = rows.slice(-12).map((r) => r.calls / maxCalls)
  const tokenTrend = rows.slice(-12).map((r) => r.totalTokens / maxTokens)
  const costTrend = rows.slice(-12).map((r) => r.costUsd / maxCost)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 头部 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="返回">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Token 用量看板</h1>
              <p className="text-sm text-gray-500">
                {scope === "all" ? "admin 视角：全量用量" : "个人视角：仅本人用量"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 聚合维度 */}
            <div className="flex items-center gap-1 rounded-lg border p-1">
              {(["day", "user", "model"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`rounded px-3 py-1 text-sm ${groupBy === g ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {g === "day" ? "按日" : g === "user" ? "按用户" : "按模型"}
                </button>
              ))}
            </div>
            {/* 时间窗 */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-900"
              aria-label="统计天数"
            >
              {[7, 30, 90].map((d) => (
                <option key={d} value={d}>
                  近 {d} 天
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {degraded ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-8 text-center text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            持久化未启用：配置 DATABASE_URL 并执行迁移后，用量数据将在此聚合（见
            07-生产供给配置手册）
          </div>
        ) : (
          <>
            {/* 汇总卡片（SummaryCard：动效即语义，值变化时数字滚动 + 趋势 sparkline） */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard label="调用次数" value={totalCalls} sparkline={callTrend} accent="#60a5fa" />
              <SummaryCard label="总 Tokens" value={totalTokens} format={formatTokens} sparkline={tokenTrend} />
              <SummaryCard
                label="折算成本（USD）"
                value={Number(totalCost.toFixed(4))}
                format={(v) => `$${v.toFixed(4)}`}
                sparkline={costTrend}
                accent="#34d399"
              />
            </div>

            {/* 明细表 */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
                <BarChart3 className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p>统计窗口内暂无调用记录</p>
                <p className="mt-1 text-xs">对话或 Agent 调用后，用量将在此实时聚合</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white dark:bg-gray-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="px-4 py-3">{groupBy === "day" ? "日期" : groupBy === "user" ? "用户" : "模型"}</th>
                      <th className="px-4 py-3">调用</th>
                      <th className="px-4 py-3">输入</th>
                      <th className="px-4 py-3">输出</th>
                      <th className="px-4 py-3">成本</th>
                      <th className="px-4 py-3">平均延迟</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.groupKey} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {r.groupKey}
                          {groupBy !== "model" && (
                            <span className="ml-2 text-xs text-gray-400">{r.model}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{r.calls}</td>
                        <td className="px-4 py-3">{formatTokens(r.inputTokens)}</td>
                        <td className="px-4 py-3">{formatTokens(r.outputTokens)}</td>
                        <td className="px-4 py-3">${r.costUsd.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          {r.avgLatencyMs != null ? `${r.avgLatencyMs}ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
