"use client"

/**
 * ResultPageShell — 结果页统一模板（P2-2 交付物）
 * 依据：docs/yyc3-novamind-m3-20260918/09-设计美化实施推进方案.md Task P2-2
 * 适用：mindmap-result / ppt-result / poster-result 等产物展示页
 *
 * 统一职责：loading 骨架 / 空态（404）/ 顶部工具栏（返回 + 标题 + 元信息 + 动作区）
 * 差异注入：loading 文案 / 空态文案 / 工具栏动作 / 主体内容 children
 */

import { ArrowLeft, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

export interface ResultPageShellProps {
  /** 是否加载中（true 时整页渲染 loading 骨架） */
  loading: boolean
  /** 加载态文案 */
  loadingText?: string
  /** 主题色（loading spinner） */
  accent?: string
  /** 数据为空/不存在 */
  isEmpty?: boolean
  /** 空态图标 */
  emptyIcon?: LucideIcon
  /** 空态标题 */
  emptyTitle?: string
  /** 空态描述 */
  emptyDesc?: string
  /** 工具栏标题 */
  title: string
  /** 标题下方元信息（如「创建于 2026-09-24」） */
  meta?: ReactNode
  /** 工具栏右侧动作区（缩放/导出/分享等） */
  actions?: ReactNode
  /** 主体内容 */
  children: ReactNode
}

export function ResultPageShell({
  loading,
  loadingText,
  accent = "#a78bfa",
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDesc,
  title,
  meta,
  actions,
  children,
}: ResultPageShellProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: accent }}
          ></div>
          <p className="text-gray-400">{loadingText}</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />}
          <h2 className="text-xl font-semibold text-white mb-2">{emptyTitle}</h2>
          <p className="text-gray-400 mb-4">{emptyDesc}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-panel text-white">
      {/* 顶部工具栏 */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg" aria-label="返回">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {meta && <p className="text-sm text-gray-400">{meta}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
