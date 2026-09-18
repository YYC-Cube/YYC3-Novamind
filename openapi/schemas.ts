import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

/**
 * YYC³ NovaMind OpenAPI 种子 Schema
 *
 * 用法：被 next-openapi-gen 扫描并生成 OpenAPI 3.1 契约
 * 路径：`./openapi/schemas/*.ts`（next-openapi-gen 配置）
 *
 * 演进：每个 API route 在迁移时，将其内部 TS interface 替换为本文件中
 * 导出的 Zod schema，并加上 JSDoc @openapi 注解。
 */

// ========== 通用响应包装 ==========

export const ApiResponseSchema = z
  .object({
    success: z.boolean().openapi({ description: "是否成功", example: true }),
    data: z.unknown().optional().openapi({ description: "业务负载" }),
    trace_id: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: "链路追踪 ID", example: "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d" }),
  })
  .openapi("ApiResponse")

export const ApiErrorSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.object({
      code: z.string().openapi({ example: "VALIDATION_ERROR" }),
      message: z.string().openapi({ example: "Invalid request body" }),
      details: z.record(z.string(), z.unknown()).optional(),
    }),
    trace_id: z.string().uuid().optional(),
  })
  .openapi("ApiError")

// ========== AI ==========

export const AIRequestSchema = z
  .object({
    prompt: z.string().min(1).max(32000).openapi({ description: "提示词" }),
    model: z.string().optional().openapi({ example: "gpt-4o" }),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(8192).optional(),
  })
  .openapi("AIRequest")

export const AIConfigUpdateSchema = z
  .object({
    provider: z.enum(["openai", "anthropic", "local"]),
    apiKey: z.string().min(1),
    baseUrl: z.string().url().optional(),
    model: z.string().min(1),
  })
  .openapi("AIConfigUpdate")

// ========== 图像分析 ==========

export const ImageAnalyzeRequestSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().optional(),
    features: z.array(z.enum(["ocr", "objects", "faces", "scene"])).optional(),
  })
  .refine((d) => d.imageUrl || d.imageBase64, {
    message: "imageUrl 或 imageBase64 必须提供其一",
  })
  .openapi("ImageAnalyzeRequest")

// ========== 认证 ==========

export const AuthRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(64).optional(),
  })
  .openapi("AuthRequest")

export const AuthUpdateSchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    avatar: z.string().url().optional(),
    preferences: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("AuthUpdate")

// ========== 对话 ==========

export const ChatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(32000),
  })
  .openapi("ChatMessage")

export const ChatRequestSchema = z
  .object({
    messages: z.array(ChatMessageSchema).min(1).max(50),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(8192).optional(),
    stream: z.boolean().optional(),
  })
  .openapi("ChatRequest")

// ========== 服务信息 ==========

export const ServiceInfoSchema = z
  .object({
    name: z.string().openapi({ example: "YYC³ NovaMind" }),
    version: z.string().openapi({ example: "2.0.0" }),
    status: z.enum(["healthy", "degraded", "unhealthy"]),
    uptime: z.number().int().nonnegative().openapi({ description: "秒" }),
    timestamp: z.string().datetime(),
  })
  .openapi("ServiceInfo")
