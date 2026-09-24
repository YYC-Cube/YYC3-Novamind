/**
 * YYC³ NovaMind · Drizzle Schema（资产 2：类型安全持久化层）
 *
 * 四表起步：users / chats / messages / feedback
 * 消息模型直接复用 AI SDK v5 的 UIMessage JSONB 直存（避免二次抽象）
 * Phase B 预留：documents / chunks（pgvector RAG）
 */
import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
})

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull().default("新对话"),
  provider: varchar("provider", { length: 50 }).notNull().default("openai"),
  model: varchar("model", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  // AI SDK v5 UIMessage 结构 JSONB 直存（role/parts/metadata）
  data: jsonb("data").notNull(),
  // Token 用量冗余列，供成本观测聚合（资产 8 反馈闭环前置）
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  rating: varchar("rating", { length: 10 }).notNull(), // up | down
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Phase B RAG 预留（文档 06 · 资产 6）
// documents / chunks(vector(1536)) 表在 Phase B 迁移中追加

// ── RAG 知识库（Phase B · 文档 06 资产 6：pgvector 单库路线）──
// embedding 列为 pgvector vector(1536)；drizzle-orm 暂无原生 vector 类型，
// 实际建表由 drizzle/*.sql 迁移模板执行（含 CREATE EXTENSION vector）
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  chunkCount: integer("chunk_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ── 成本观测（Phase D · 文档 06 资产 9：usage_logs 持久化用量）──
export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 50 }).notNull().default("openai"),
  model: varchar("model", { length: 100 }).notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  latencyMs: integer("latency_ms"),
  // 冗余日期键（UTC yyyy-mm-dd），按日聚合免走函数索引
  usageDate: varchar("usage_date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type Chat = typeof chats.$inferSelect
export type Message = typeof messages.$inferSelect
export type Feedback = typeof feedback.$inferSelect
export type Document = typeof documents.$inferSelect
export type Chunk = typeof chunks.$inferSelect
export type UsageLog = typeof usageLogs.$inferSelect
