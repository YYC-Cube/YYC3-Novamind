/**
 * YYC³ NovaMind · DB 客户端（DSN 驱动降级 — 沿用 Sentry 惯例）
 *
 * DATABASE_URL 存在 → 真实 Postgres 连接（postgres.js 驱动）
 * DATABASE_URL 缺失 → isDbEnabled=false，上层持久化调用静默跳过（零成本禁用）
 */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

export const isDbEnabled = Boolean(connectionString)

// 非导出惰性单例：未配置 DSN 时永不实例化连接
let _client: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!isDbEnabled || !connectionString) {
    throw new Error("数据库未启用：缺少 DATABASE_URL 环境变量")
  }
  if (!_client) {
    const queryClient = postgres(connectionString, {
      // Serverless 场景（Vercel/Neon）防连接泄漏
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    _client = drizzle(queryClient, { schema })
  }
  return _client
}

export { schema }
