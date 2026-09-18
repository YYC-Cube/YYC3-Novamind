import { EnhancedErrorHandler, ErrorSeverity, ErrorType } from "@/lib/error-handler"
import { ChatRequestSchema } from "@/openapi/schemas"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

/** @openapi
 * AI 对话同步接口
 * @desc 调用 AI 模型生成单轮回复，返回 OpenAI 兼容结构
 * @body ChatRequest
 * @response ChatResponse
 */
export async function POST(request: NextRequest) {
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

    // 调用AI生成回复
    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature,
      maxTokens,
    })

    const responseTime = Date.now() - startTime

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
        prompt_tokens: usage?.promptTokens ?? 0,
        completion_tokens: usage?.completionTokens ?? 0,
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
}

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
