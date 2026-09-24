/**
 * 全局翻页动画模板（P3-1 交付物）
 *
 * Next.js template.tsx 语义：每次路由切换重新挂载 → 动画自然重放
 * - Server Component，零客户端 JS（动画纯 CSS，keyframes 注册于 app/tokens.css）
 * - 200ms cubic-bezier(0.4, 0, 0.2, 1) Apple 节奏（--motion-page 令牌）
 * - prefers-reduced-motion: reduce 下 animation: none 自动禁用（tokens.css 内建）
 *
 * 已知权衡（09 台账 P3-1）：动画期间 transform 使内部 position: fixed 后代
 * 以本容器为 containing block；全站排查常驻首帧 fixed 仅 mindmap-result
 * 缩放控件一处，200ms 内位移可感知度极低，不做特判。
 */
import type { ReactNode } from "react"

export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>
}
