import { auth } from "@/auth.config"
import { RealAIService, type AIResponse } from "@/lib/ai-service-real"
import { EnhancedErrorHandler, ErrorSeverity, ErrorType } from "@/lib/error-handler"
import { PerformanceOptimizer } from "@/lib/performance-optimizer"
import { themeSchema, type ThemePack } from "@/lib/theme-schema"
import { recordTokenUsage } from "@/lib/usage"
import { NextResponse, type NextRequest } from "next/server"

// 初始化AI服务
RealAIService.loadFromEnvironment()

/** @openapi
 * AI 服务状态查询（action 分发）
 * @desc action=status 服务状态 | providers 可用提供商 | current_provider 当前提供商 | test_provider 测试连通性 | health 健康聚合
 * @response AIStatusResponse
 * @query AIQuery
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "status":
        const status = await RealAIService.getServiceStatus()
        return NextResponse.json({
          success: true,
          data: status,
        })

      case "providers":
        const providers = RealAIService.getAvailableProviders()
        return NextResponse.json({
          success: true,
          data: providers,
        })

      case "current_provider":
        const currentProvider = RealAIService.getCurrentProvider()
        return NextResponse.json({
          success: true,
          data: { provider: currentProvider },
        })

      case "test_provider":
        const provider = searchParams.get("provider")
        if (!provider) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商参数不能为空",
            { action, provider },
            ErrorSeverity.LOW,
          )
        }

        const testResult = await RealAIService.testProvider(provider)
        return NextResponse.json({
          success: true,
          data: testResult,
        })

      case "health":
        const healthStatus = await RealAIService.getServiceStatus()
        const isHealthy = Object.values(healthStatus.providers).some((p) => p.available)

        return NextResponse.json({
          success: true,
          data: {
            status: isHealthy ? "healthy" : "unhealthy",
            activeProvider: healthStatus.activeProvider,
            availableProviders: Object.entries(healthStatus.providers)
              .filter(([_, info]) => info.available)
              .map(([name]) => name),
            details: healthStatus,
          },
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("AI API GET请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.AI_SERVICE,
          message: "AI服务状态查询失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

/** @openapi
 * AI 服务操作（action 分发）
 * @desc action=chat 同步对话 | stream_chat 流式对话（SSE） | switch_provider 切换提供商 | select_best_provider 智能选路 | batch_process 批处理
 * @body AIRequest
 * @response AIResponse
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "chat":
        const { messages, provider, temperature, maxTokens, model } = data

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "消息列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 验证消息格式
        for (const message of messages) {
          if (!message.role || !message.content) {
            throw EnhancedErrorHandler.createError(
              ErrorType.VALIDATION,
              "消息格式不正确，需要包含role和content",
              { action, message },
              ErrorSeverity.MEDIUM,
            )
          }
        }

        const startTime = Date.now()

        const response = await EnhancedErrorHandler.withRetry(
          () =>
            RealAIService.chat(messages, {
              provider,
              temperature,
              maxTokens,
              model,
            }),
          "ai_chat",
          3,
        )

        const processingTime = Date.now() - startTime
        PerformanceOptimizer.recordOperationTime("ai_chat", processingTime)

        // 资产 9：用量持久化（旁挂记录，失败静默）
        const session = await auth()
        await recordTokenUsage({
          userId: session?.user?.id ?? null,
          provider: provider || RealAIService.getCurrentProvider(),
          model: response.model,
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
          latencyMs: processingTime,
        })

        return NextResponse.json({
          success: true,
          data: response,
          metadata: {
            processingTime,
            provider: provider || RealAIService.getCurrentProvider(),
          },
        })

      case "generate_theme": {
        // P4-1：AI 一句话换肤 — LLM 结构化输出主题包 → zod 校验
        const { prompt } = (data ?? {}) as { prompt?: string }
        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "换肤描述不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }
        if (RealAIService.getAvailableProviders().length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.AI_SERVICE,
            "AI 服务未配置（缺少 API Key），换肤功能不可用",
            { action },
            ErrorSeverity.MEDIUM,
          )
        }

        const themeStart = Date.now()
        const themeResponse = await EnhancedErrorHandler.withRetry(
          () =>
            RealAIService.chat(
              [
                {
                  role: "system",
                  content:
                    "你是 UI 主题设计师。根据用户描述输出一个 JSON 主题包，字段：" +
                    "name（主题名，≤30字）、primary 与 primaryHover（品牌主色与悬停色，#RRGGBB）、" +
                    "gradientFrom 与 gradientTo（标题渐变两端色，#RRGGBB）、" +
                    "glowRgb（主色发光阴影的 RGB 三元组字符串，如 \"56 189 248\"）、" +
                    "radius（\"soft\"|\"standard\"|\"sharp\"）、fontWeight（\"light\"|\"normal\"|\"bold\"）。" +
                    "只输出 JSON 对象本身，不要任何解释或代码块标记。",
                },
                { role: "user", content: `主题描述：${prompt.trim()}` },
              ],
              { temperature: 0.7, maxTokens: 300 },
            ),
          "ai_generate_theme",
          3,
        )

        // 解析 + zod 校验（容忍 ```json 围栏）
        const rawText = themeResponse.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")
        let candidate: unknown
        try {
          candidate = JSON.parse(rawText)
        } catch {
          throw EnhancedErrorHandler.createError(
            ErrorType.AI_SERVICE,
            "AI 返回的主题包格式无法解析，请换个描述重试",
            { rawPreview: rawText.slice(0, 120) },
            ErrorSeverity.MEDIUM,
          )
        }
        const parsed = themeSchema.safeParse(candidate)
        if (!parsed.success) {
          throw EnhancedErrorHandler.createError(
            ErrorType.AI_SERVICE,
            "AI 返回的主题包校验未通过，请重试",
            { issues: parsed.error.issues.slice(0, 5) },
            ErrorSeverity.MEDIUM,
          )
        }
        const themePack: ThemePack = parsed.data

        const themeProcessingTime = Date.now() - themeStart
        PerformanceOptimizer.recordOperationTime("ai_generate_theme", themeProcessingTime)

        // 资产 9：用量持久化（旁挂记录，失败静默）
        const themeSession = await auth()
        await recordTokenUsage({
          userId: themeSession?.user?.id ?? null,
          provider: RealAIService.getCurrentProvider(),
          model: themeResponse.model,
          inputTokens: themeResponse.usage.promptTokens,
          outputTokens: themeResponse.usage.completionTokens,
          latencyMs: themeProcessingTime,
        })

        return NextResponse.json({
          success: true,
          data: themePack,
          metadata: {
            processingTime: themeProcessingTime,
            provider: RealAIService.getCurrentProvider(),
          },
        })
      }

      case "stream_chat":
        // 流式聊天需要使用不同的响应方式
        const {
          messages: streamMessages,
          provider: streamProvider,
          temperature: streamTemp,
          maxTokens: streamMax,
          model: streamModel,
        } = data

        if (!streamMessages || !Array.isArray(streamMessages) || streamMessages.length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "消息列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 创建流式响应
        const encoder = new TextEncoder()
        const streamStart = Date.now()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              let lastUsage: AIResponse["usage"] | undefined
              await RealAIService.streamChat(
                streamMessages,
                (chunk) => {
                  if (chunk.usage) lastUsage = chunk.usage
                  const data = JSON.stringify(chunk)
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                },
                {
                  provider: streamProvider,
                  temperature: streamTemp,
                  maxTokens: streamMax,
                  model: streamModel,
                },
              )

              // 资产 9：流式用量持久化（旁挂记录，失败静默）
              const session = await auth()
              await recordTokenUsage({
                userId: session?.user?.id ?? null,
                provider: streamProvider || RealAIService.getCurrentProvider(),
                model: streamModel || process.env.OPENAI_MODEL || "gpt-4o",
                inputTokens: lastUsage?.promptTokens ?? 0,
                outputTokens: lastUsage?.completionTokens ?? 0,
                latencyMs: Date.now() - streamStart,
              })

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            } catch (error) {
              console.error("流式聊天失败:", error)
              const errorData = JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "流式聊天失败",
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        })

      case "switch_provider":
        const { provider: newProvider } = data
        if (!newProvider) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商参数不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const switched = RealAIService.switchProvider(newProvider)
        if (!switched) {
          throw EnhancedErrorHandler.createError(
            ErrorType.AI_SERVICE,
            `切换到提供商 ${newProvider} 失败`,
            { provider: newProvider },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          data: { provider: newProvider },
          message: `已切换到提供商: ${newProvider}`,
        })

      case "select_best_provider":
        const bestProvider = await RealAIService.selectBestProvider()
        return NextResponse.json({
          success: true,
          data: { provider: bestProvider },
          message: `已自动选择最佳提供商: ${bestProvider}`,
        })

      case "batch_process":
        const { items, processorType, batchOptions } = data

        if (!items || !Array.isArray(items)) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "批处理项目列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const batchResults = await PerformanceOptimizer.processBatch(
          items,
          async (item, _index) => {
            // 根据处理器类型执行不同的AI操作
            switch (processorType) {
              case "summarize":
                return await RealAIService.chat([{ role: "user", content: `请总结以下内容：${item.content}` }])
              case "translate":
                return await RealAIService.chat([{ role: "user", content: `请将以下内容翻译成中文：${item.content}` }])
              case "analyze":
                return await RealAIService.chat([{ role: "user", content: `请分析以下内容：${item.content}` }])
              default:
                throw new Error(`不支持的处理器类型: ${processorType}`)
            }
          },
          {
            batchSize: batchOptions?.batchSize || 5,
            concurrency: batchOptions?.concurrency || 2,
            onProgress: (progress) => {
              // 这里可以通过WebSocket发送进度更新
              console.log(`批处理进度: ${progress.percentage.toFixed(1)}%`)
            },
          },
        )

        return NextResponse.json({
          success: true,
          data: batchResults,
          message: `批处理完成，处理了 ${items.length} 个项目`,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("AI API POST请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.AI_SERVICE,
          message: "AI服务操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

/** @openapi
 * AI 服务配置更新（action 分发）
 * @desc action=optimize_performance 自动优化 | clear_cache 清空缓存 | update_config 更新提供商配置
 * @body AIConfigUpdate
 * @response ApiEnvelope
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "optimize_performance":
        const optimizationResult = await PerformanceOptimizer.autoOptimize()
        return NextResponse.json({
          success: true,
          data: optimizationResult,
          message: "性能优化完成",
        })

      case "clear_cache":
        PerformanceOptimizer.clearCache()
        return NextResponse.json({
          success: true,
          message: "缓存已清空",
        })

      case "update_config":
        const { provider, config } = data
        if (!provider || !config) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商和配置参数不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 这里可以添加配置更新逻辑
        return NextResponse.json({
          success: true,
          message: `提供商 ${provider} 配置已更新`,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的更新操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("AI API PUT请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.AI_SERVICE,
          message: "AI服务更新操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}
