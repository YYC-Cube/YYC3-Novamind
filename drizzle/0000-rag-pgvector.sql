-- YYC³ NovaMind · RAG 迁移模板（文档 06 · 资产 6）
-- 用法：在 pnpm db:generate 产出的迁移 SQL 之前手动执行本文件
--       （pgvector 扩展列非 drizzle 原生类型，需 SQL 前置）
-- 前置：PostgreSQL 14+；托管库需支持 vector 扩展（Neon/Supabase 开箱即用）

-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. documents 元数据表（与 lib/db/schema.ts documents 对齐）
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. chunks 内容 + 向量双索引表
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),          -- text-embedding-3-small 维度；zero-vector = 降级
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 混合检索索引：向量 HNSW + 全文 GIN
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_content_fts ON chunks USING gin (to_tsvector('simple', content));
CREATE INDEX IF NOT EXISTS chunks_document_idx ON chunks (document_id);
