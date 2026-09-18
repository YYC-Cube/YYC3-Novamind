// Sentry 浏览器端初始化（客户端组件树 + 全局错误）
// DSN 缺省时完全禁用，零开销不阻塞构建；配置 NEXT_PUBLIC_SENTRY_DSN 后自动启用
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    // 采样率：生产全量错误 + 10% 性能采样（可按流量调整）
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    // 隐私保护：不采集文本/输入内容
    sendDefaultPii: false,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
