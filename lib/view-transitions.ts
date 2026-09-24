/**
 * navigateWithTransition — View Transitions API 封装（P3-2 交付物）
 *
 * - Chrome/Edge 111+ / Safari 18+：文档级过渡，配合 view-transition-name 配对实现
 *   列表卡片 → 详情页标题的共享元素形变（命名约定：conversation-card-{id} / path-card-{id}）
 * - 不支持的浏览器或 prefers-reduced-motion: reduce：直接调用 update，优雅降级为零开销直跳
 * - vt-active 期间禁用全局 page-enter（见 tokens.css）：避免新页面快照捕获到翻页动画首帧
 *   （opacity: 0）导致过渡闪黑；transition.finished 后移除恢复默认翻页动画
 */
export function navigateWithTransition(update: () => void): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    update()
    return
  }
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!doc.startViewTransition || prefersReduced) {
    update()
    return
  }
  document.documentElement.classList.add("vt-active")
  const transition = doc.startViewTransition(update)
  void transition.finished.finally(() => {
    document.documentElement.classList.remove("vt-active")
  })
}
