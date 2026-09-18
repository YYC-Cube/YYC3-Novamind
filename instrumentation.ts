// Sentry 服务端初始化（RSC / Route Handlers / Server Actions）
// SENTRY_DSN 缺省时完全禁用
export async function register() {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return
  }

  const { Sentry } = await import("./lib/sentry-server")
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
  })
}

export const onRequestError = async (...args: unknown[]) => {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return
  }
  const { captureRequestError } = await import("./lib/sentry-server")
  captureRequestError(...(args as Parameters<typeof captureRequestError>))
}
