"use client"

/**
 * GeneratorPageShell — 生成器页统一模板（P2-1 交付物）
 * 依据：docs/yyc3-novamind-m3-20260918/09-设计美化实施推进方案.md Task P2-1
 * 适用：mindmap / ppt / poster 等画布型生成页（webpage 为表单型不适用）
 *
 * 统一职责：生成中全屏加载态 / 渐变背景 / 顶部工具栏（返回 + 标题 + 动作区 children）
 * 差异注入：icon / accent 色 / 加载文案 / 标题 / 工具栏动作
 */

import { ArrowLeft, Loader2, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type ReactNode, type RefObject } from "react"

export interface GeneratorPageShellProps {
  /** 页面标识图标（加载态中心 + 无他用时可不传） */
  icon: LucideIcon
  /** 主题强调色（Tailwind 色名，如 "purple" / "orange"） */
  accent: "purple" | "orange" | "blue" | "pink"
  /** 生成中的标题，如「AI正在生成思维导图」 */
  loadingTitle: string
  /** 生成中的分步提示文案 */
  loadingSteps: string[]
  /** 是否处于生成中（true 时整页渲染加载态） */
  isGenerating: boolean
  /** 工具栏标题（返回键右侧），如「{query} - 思维导图」 */
  title: string
  /** 工具栏右侧动作区（导出/分享/预览等按钮） */
  actions?: ReactNode
  /** 主内容容器 ref（画布手势/尺寸监听用） */
  containerRef?: RefObject<HTMLDivElement | null>
  /** 主内容（画布/编辑器） */
  children: ReactNode
}

const ACCENT_MAP = {
  purple: { border: "border-purple-400/30", top: "border-t-purple-400", text: "text-purple-400" },
  orange: { border: "border-orange-400/30", top: "border-t-orange-400", text: "text-orange-400" },
  blue: { border: "border-blue-400/30", top: "border-t-blue-400", text: "text-blue-400" },
  pink: { border: "border-pink-400/30", top: "border-t-pink-400", text: "text-pink-400" },
} as const

export function GeneratorPageShell({
  icon: Icon,
  accent,
  loadingTitle,
  loadingSteps,
  isGenerating,
  title,
  actions,
  containerRef,
  children,
}: GeneratorPageShellProps) {
  const router = useRouter()
  const c = ACCENT_MAP[accent]

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className={`w-24 h-24 border-4 ${c.border} rounded-full animate-spin ${c.top}`}></div>
            <Icon
              className={`w-10 h-10 ${c.text} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse`}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{loadingTitle}</h2>
          {loadingSteps.map((step) => (
            <p key={step} className="text-gray-400 mb-2">
              {step}
            </p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-surface-panel relative overflow-hidden"
    >
      {/* 顶部工具栏（统一：返回 + 标题 + 动作区） */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">{actions}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

/** 工具栏圆形动作按钮（各生成页共享样式） */
export function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick?: () => void
  active?: boolean
  title?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-full transition-colors ${active ? "bg-brand/20 text-purple-300" : "bg-white/10 text-white hover:bg-white/20"
        }`}
    >
      {children}
    </button>
  )
}

/** 行内加载指示（表单型页面的按钮 loading 态共用） */
export function InlineSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />
}
