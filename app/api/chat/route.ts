import { auth } from "@/auth.config"
import { recordUsage, withGuard } from "@/lib/api-guard"
import { buildContext, formatKnowledgeContext } from "@/lib/context-engine"
import { getDb, isDbEnabled } from "@/lib/db"
import { chats, messages as messagesTable, users } from "@/lib/db/schema"
import { EnhancedErrorHandler, ErrorSeverity, ErrorType } from "@/lib/error-handler"
import { searchKnowledgeBase } from "@/lib/rag"
import { recordTokenUsage } from "@/lib/usage"
import { ChatRequestSchema } from "@/openapi/schemas"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

/** @openapi
 * AI 对话同步接口
 * @desc 调用 AI 模型生成单轮回复，返回 OpenAI 兼容结构（限流/消毒/成本闸三重防护）
 * @body ChatRequest
 * @response ChatResponse
 */
export const POST = withGuard(async (request: Request) => {
  try {
    const rawBody = await request.json()
    const parsed = ChatRequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      throw EnhancedErrorHandler.createError(
        ErrorType.VALIDATION,
        "请求体校验失败",
        {
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        ErrorSeverity.LOW,
      )
    }

    const { messages, temperature = 0.7, maxTokens = 2000 } = parsed.data
    const startTime = Date.now()

    // 资产 10：上下文工程 — 分区/摘要压缩 + RAG 知识注入（全链路降级安全）
    let knowledgeContext = ""
    try {
      const lastUser = [...messages].reverse().find((m) => m.role === "user")
      if (lastUser) {
        const { chunks, degraded } = await searchKnowledgeBase(lastUser.content, 3)
        if (!degraded && chunks.length > 0) {
          knowledgeContext = formatKnowledgeContext(chunks)
        }
      }
    } catch (e) {
      console.warn("[chat] RAG 注入失败（跳过）:", e)
    }
    const built = await buildContext(messages, { knowledgeContext })

    // 调用AI生成回复
    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      system: built.system || undefined,
      messages: built.messages
        .filter((m) => m.role !== "system")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      temperature,
      // AI SDK v5: maxTokens 已更名为 maxOutputTokens（外部 API 契约字段名保持 maxTokens）
      maxOutputTokens: maxTokens,
    })

    const responseTime = Date.now() - startTime
    const totalTokens = usage?.totalTokens ?? 0
    recordUsage(totalTokens) // 成本闸回写实际用量

    // 资产 9：用量持久化（旁挂记录，失败静默；登录用户取真实 ID）
    const session = await auth()
    await recordTokenUsage({
      userId: session?.user?.id ?? null,
      provider: "openai",
      model: "gpt-4o",
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      latencyMs: responseTime,
    })

    // 持久化（DSN 驱动：DATABASE_URL 缺失时静默跳过）
    if (isDbEnabled) {
      try {
        const db = getDb()
        // 匿名模式（Phase A 无 Auth）：统一挂到系统占位用户
        const [systemUser] = await db
          .insert(users)
          .values({ email: "system@novamind.local", username: "system" })
          .onConflictDoNothing()
          .returning()
        const userId =
          systemUser?.id ??
          (await db.select().from(users)).find((u) => u.email === "system@novamind.local")?.id

        if (userId) {
          const [chat] = await db
            .insert(chats)
            .values({ userId, title: messages[0]?.content?.slice(0, 50) ?? "新对话" })
            .returning()
          if (chat) {
            await db.insert(messagesTable).values({
              chatId: chat.id,
              data: { role: "assistant", parts: [{ type: "text", text }] },
              inputTokens: usage?.inputTokens ?? 0,
              outputTokens: usage?.outputTokens ?? 0,
            })
          }
        }
      } catch (dbError) {
        // 持久化失败不阻断主链路
        console.error("会话持久化失败:", dbError)
      }
    }

    return NextResponse.json({
      id: `chat-${Date.now()}`,
      choices: [
        {
          message: {
            role: "assistant",
            content: text,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: usage?.inputTokens ?? 0,
        completion_tokens: usage?.outputTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
      },
      metadata: {
        responseTime,
        model: "gpt-4o",
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    console.error("聊天API错误:", error)

    return NextResponse.json(
      {
        error: "AI服务暂时不可用，请稍后重试",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
})

/** @openapi
 * 聊天 API 健康检查
 * @desc 返回聊天 API 运行状态
 * @response ChatHealthResponse
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "聊天API正常运行",
    timestamp: new Date().toISOString(),
  })
}
