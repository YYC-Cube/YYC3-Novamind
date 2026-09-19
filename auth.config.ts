/**
 * YYC³ NovaMind · Auth.js v5 配置（文档 06 · 资产 3）
 *
 * 与既有 lib/auth.ts 融合策略：
 * - lib/auth.ts 保留：UserRole/UserPermissions 权限矩阵 + 客户端 useAuth hook（语义不变）
 * - 本文件负责：服务端会话建立（Provider 登录）+ JWT 角色注入
 * - 角色映射：邮箱匹配 AUTH_ADMIN_EMAILS 环境变量 → admin，否则 user（Phase B 接 DB 后按 users.role 动态化）
 *
 * DSN 驱动降级：AUTH_SECRET 缺失时 build 不报错，运行时访问受保护路由才要求配置。
 */
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers"
import type { UserRole } from "@/lib/auth"

const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function resolveRole(email?: string | null): UserRole {
  if (email && adminEmails.includes(email.toLowerCase())) return "admin"
  return "user"
}

const providers: Provider[] = [
  Credentials({
    name: "演示账户",
    credentials: {
      email: { label: "邮箱", type: "email" },
      password: { label: "密码", type: "password" },
    },
    // Phase A 演示通道：对接 lib/auth.ts 既有登录语义（密码 "password"），
    // Phase B 切换 Drizzle users 表哈希校验
    async authorize(credentials) {
      const email = credentials?.email
      const password = credentials?.password
      if (typeof email !== "string" || typeof password !== "string") return null
      if (password !== "password") return null
      return {
        id: `demo_${Buffer.from(email).toString("base64url")}`,
        email,
        name: email.split("@")[0],
      }
    },
  }),
]

// 配置了 OAuth 凭据才注册对应 Provider（零成本禁用）
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.unshift(GitHub)
}
if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.unshift(Google)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        ;(token as { role?: UserRole }).role = resolveRole(user.email)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { role?: UserRole }).role =
          (token as { role?: UserRole }).role ?? "user"
        // 与 lib/auth.ts User.id 语义对齐
        ;(session.user as { id?: string }).id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
