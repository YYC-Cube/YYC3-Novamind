/**
 * YYC³ NovaMind · RAG 知识库基座（文档 06 · 资产 6）
 *
 * pgvector 单库路线：documents / chunks（vector(1536)）与资产 2 共库
 * 混合检索：pgvector 余弦 + PG 全文检索（ts_rank）双路 → RRF 融合
 * DSN 驱动降级：无 DATABASE_URL 时返回降级响应（工具层显式提示）
 *
 * Phase C 升级点：embedding 生成走 OpenAI text-embedding-3-small（1536 维）
 */
import { getDb, isDbEnabled } from "@/lib/db"
import { sql } from "drizzle-orm"

export interface RetrievedChunk {
  chunkId: string
  documentId: string
  content: string
  score: number
  source: "vector" | "keyword" | "hybrid"
}

export interface SearchResult {
  chunks: RetrievedChunk[]
  degraded: boolean
  reason?: string
}

/** 单文件大小上限（入库防护） */
const MAX_DOCUMENT_CHARS = 200_000
/** 分块参数：约 500 token/块，10% 重叠 */
const CHUNK_SIZE = 1200
const CHUNK_OVERLAP = 120

/** 文本分块：滑动窗口（中英通吃，按字符切） */
export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text]

  const chunks: string[] = []
  let cursor = 0
  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + CHUNK_SIZE))
    cursor += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

/**
 * 文档入库：分块 → embedding → 向量+全文双索引
 * embedding 缺 API key 时仅建全文索引（降级可用）
 */
export async function ingestDocument(params: {
  title: string
  content: string
  sourceUrl?: string
}): Promise<{ documentId: string; chunkCount: number } | { error: string }> {
  if (!isDbEnabled) return { error: "数据库未启用（DATABASE_URL 缺失）" }
  if (!params.content || params.content.length > MAX_DOCUMENT_CHARS) {
    return { error: `内容为空或超限（>${MAX_DOCUMENT_CHARS} 字符）` }
  }

  const db = getDb()
  const pieces = chunkText(params.content)

  // embedding 批量生成（降级：无 key 时 zero-vector，检索退化为纯关键词路）
  let embeddings: number[][] = []
  if (process.env.OPENAI_API_KEY) {
    const { embedMany } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")
    const { embeddings: em } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: pieces,
    })
    embeddings = em
  }

  // 动态 SQL：vector 列由 pgvector 扩展管理（drizzle-orm 暂无原生 vector 类型）
  const docRows = await db.execute<{ id: string }>(sql`
    INSERT INTO documents (title, source_url, chunk_count)
    VALUES (${params.title}, ${params.sourceUrl ?? null}, ${pieces.length})
    RETURNING id
  `)
  const docId = docRows[0]?.id
  if (!docId) return { error: "文档插入失败" }

  for (let i = 0; i < pieces.length; i++) {
    const embedding = embeddings[i] ?? new Array(1536).fill(0)
    await db.execute(sql`
      INSERT INTO chunks (document_id, content, embedding, chunk_index)
      VALUES (${docId}, ${pieces[i]}, ${JSON.stringify(embedding)}::vector, ${i})
    `)
  }

  return { documentId: docId, chunkCount: pieces.length }
}

/**
 * 混合检索：向量余弦 + 关键词 ts_rank → RRF 融合
 * 降级链：无 DB → degraded 响应；embedding 全零 → 自动退化为纯关键词
 */
export async function searchKnowledgeBase(
  query: string,
  topK = 5,
): Promise<SearchResult> {
  if (!isDbEnabled) {
    return {
      chunks: [],
      degraded: true,
      reason: "知识库未启用：需配置 DATABASE_URL（pgvector 扩展）",
    }
  }

  const db = getDb()

  // 查询向量（无 key 时跳过向量路）
  let queryVec: number[] | null = null
  if (process.env.OPENAI_API_KEY) {
    const { embed } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    })
    queryVec = embedding
  }

  // RRF 常数（论文推荐值）
  const K = 60
  const vecLimit = topK * 3
  const keywordPattern = query.replace(/[!@#$%^&*()_+=\[\]{};:'",.<>?/\\|`~]/g, " ").trim()

  const vecSql = queryVec
    ? sql`${JSON.stringify(queryVec)}::vector`
    : null

  const rows = await db.execute<{
    id: string
    document_id: string
    content: string
    vec_rank: number | null
    kw_rank: number | null
  }>(sql`
    WITH vec AS (
      SELECT id, document_id, content,
             ROW_NUMBER() OVER (ORDER BY embedding <=> ${vecSql} ASC) AS rank
      FROM chunks
      WHERE ${queryVec ? sql`embedding <=> ${vecSql} < 0.9` : sql`FALSE`}
      ORDER BY embedding <=> ${vecSql} ASC
      LIMIT ${vecLimit}
    ),
    kw AS (
      SELECT id, document_id, content,
             ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('simple', content), plainto_tsquery('simple', ${keywordPattern})) DESC) AS rank
      FROM chunks
      WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', ${keywordPattern})
      LIMIT ${vecLimit}
    )
    SELECT c.id, c.document_id, c.content,
           v.rank AS vec_rank, k.rank AS kw_rank
    FROM chunks c
    LEFT JOIN vec v ON v.id = c.id
    LEFT JOIN kw k ON k.id = c.id
    WHERE v.id IS NOT NULL OR k.id IS NOT NULL
  `)

  // RRF 融合评分
  const scored: RetrievedChunk[] = rows.map((r: { id: string; document_id: string; content: string; vec_rank: number | null; kw_rank: number | null }) => {
    let score = 0
    let source: RetrievedChunk["source"] = "vector"
    if (r.vec_rank !== null) score += 1 / (K + r.vec_rank)
    if (r.kw_rank !== null) {
      score += 1 / (K + r.kw_rank)
      source = r.vec_rank !== null ? "hybrid" : "keyword"
    }
    return { chunkId: r.id, documentId: r.document_id, content: r.content, score, source }
  })

  scored.sort((a, b) => b.score - a.score)

  return {
    chunks: scored.slice(0, topK),
    degraded: !queryVec, // 无向量路时标记降级（纯关键词仍可用）
    reason: queryVec ? undefined : "未配置 OPENAI_API_KEY，检索退化为纯关键词模式",
  }
}
