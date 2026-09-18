// Sentry 服务端共享模块（仅在有 DSN 时被 instrumentation.ts 动态加载）
import * as Sentry from "@sentry/nextjs"

export { Sentry }

export function captureRequestError(
  error: unknown,
  request: unknown,
  context: Record<string, unknown> = {},
) {
  Sentry.captureException(error, {
    extra: { request, ...context },
  })
}
