/**
 * YYC³ NovaMind · 边缘中间件（Phase A 资产 3）
 *
 * 策略：API 写路由强制会话闸门（401 JSON），页面路由放行（客户端登录态渲染）
 * PUBLIC_PATHS：健康检查 / OpenAPI 文档 / Auth 自身 / 静态资源
 */
import { auth } from "@/auth.config"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = [
  /^\/api\/auth\//,
  /^\/api\/chat\/$/, // GET 健康检查在 handler 内区分
  /^\/api\/health/,
  /^\/docs/,
  /^\/_next/,
  /^\/favicon/,
  /^\/login$/,
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 公开路径直接放行
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next()
  }

  // API 写操作：无会话 → 401
  if (pathname.startsWith("/api/") && req.method !== "GET" && !req.auth) {
    return NextResponse.json({ error: "未登录或会话过期" }, { status: 401 })
  }

  return NextResponse.next()
})

export const config = {
  // 排除静态资源与 PWA 资产
  matcher: ["/((?!_next/static|_next/image|sw.js|manifest.json|yyc3-icons|.*\\.png$).*)"],
}
