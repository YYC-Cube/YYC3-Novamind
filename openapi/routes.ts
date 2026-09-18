import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

/**
 * 路由级 Zod schemas
 *
 * 每个 schema 对应 app/api 下的 route.ts 中的请求/响应类型。
 * 迁移原则：route.ts 中的 TypeScript interface 必须逐步替换为这里的 Zod schema。
 */

import {
  AIConfigUpdateSchema,
  AIRequestSchema,
  ApiErrorSchema,
  ApiResponseSchema,
  AuthRequestSchema,
  AuthUpdateSchema,
  ChatMessageSchema,
  ChatRequestSchema,
  ImageAnalyzeRequestSchema,
  ServiceInfoSchema,
} from "./schemas"

// ========== 路由：/api/ai ==========

export const AIStatusQuerySchema = z.object({
  action: z.enum([
    "status",
    "providers",
    "current_provider",
    "test_provider",
    "health",
  ]),
  provider: z.string().optional(),
})

// ========== 路由：/api/database ==========

export const DatabaseActionSchema = z.object({
  action: z.enum(["query", "execute", "schema", "health", "stats"]),
})

// ========== 路由：/api/sync ==========

export const SyncRequestSchema = z.object({
  deviceId: z.string().min(1),
  lastSyncAt: z.string().datetime().optional(),
  changes: z
    .array(
      z.object({
        entity: z.string(),
        id: z.string(),
        operation: z.enum(["create", "update", "delete"]),
        payload: z.unknown(),
      }),
    )
    .optional(),
})

// ========== 路由：/api/upload ==========

export const UploadMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(50 * 1024 * 1024),
})

// 导出聚合（便于 next-openapi-gen 收集）
export const AllSchemas = {
  ApiResponse: ApiResponseSchema,
  ApiError: ApiErrorSchema,
  AIRequest: AIRequestSchema,
  AIConfigUpdate: AIConfigUpdateSchema,
  ImageAnalyzeRequest: ImageAnalyzeRequestSchema,
  AuthRequest: AuthRequestSchema,
  AuthUpdate: AuthUpdateSchema,
  ChatRequest: ChatRequestSchema,
  ChatMessage: ChatMessageSchema,
  ServiceInfo: ServiceInfoSchema,
  AIStatusQuery: AIStatusQuerySchema,
  DatabaseAction: DatabaseActionSchema,
  SyncRequest: SyncRequestSchema,
  UploadMetadata: UploadMetadataSchema,
}
