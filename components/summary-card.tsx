"use client"

/**
 * SummaryCard — 摘要指标卡（P2-3 交付物，对标 2026「摘要卡片 > 图表墙」行业范式）
 * 结构：标签 + 值 + vs 基线百分比 + 迷你趋势 sparkline
 * 动效即语义：数字滚动仅在值变化时触发
 */

import { useEffect, useRef, useState } from "react"

export interface SummaryCardProps {
  /** 指标标签，如「总 Tokens」 */
  label: string
  /** 指标值（数字部分） */
  value: number
  /** 值格式化（千分位/单位/货币） */
  format?: (v: number) => string
  /** 环比基线百分比（正=上升，负=下降），无基线时不显示 */
  vsBaseline?: number
  /** 迷你趋势数据（归一化 0~1 序列） */
  sparkline?: number[]
  /** sparkline 描边色 */
  accent?: string
}

/** 数字滚动：仅在值变化时触发过渡（动效即语义） */
function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    if (prevRef.current === target) return
    prevRef.current = target
    let raf = 0
    const tick = () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (prefersReduced) {
        setDisplay(target)
        return
      }
      const start = performance.now()
      const step = (t: number) => {
        const progress = Math.min(1, (t - start) / duration)
        const eased = 1 - (1 - progress) ** 3
        setDisplay(eased * target)
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}

export function SummaryCard({
  label,
  value,
  format = (v) => v.toLocaleString(),
  vsBaseline,
  sparkline,
  accent = "#a78bfa",
}: SummaryCardProps) {
  const display = useAnimatedNumber(value)
  const up = (vsBaseline ?? 0) >= 0

  return (
    <div className="bg-surface-card backdrop-blur-xl rounded-2xl border border-white/10 p-5">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">{format(display)}</div>
          {vsBaseline !== undefined && (
            <div className={`text-xs mt-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? "↑" : "↓"} {Math.abs(vsBaseline).toFixed(1)}% vs 基线
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <svg width="72" height="28" viewBox="0 0 72 28" className="shrink-0" aria-hidden>
            <polyline
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkline
                .map((v, i) => {
                  const x = (i / (sparkline.length - 1)) * 70 + 1
                  const y = 26 - Math.max(0, Math.min(1, v)) * 24
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                .join(" ")}
            />
          </svg>
        )}
      </div>
    </div>
  )
}
