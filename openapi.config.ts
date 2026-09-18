import type { PluginConfig } from "next-openapi-gen"

/**
 * next-openapi-gen 配置（SSOT：自动生成为唯一契约源）
 *
 * 工作流程：
 * 1. 扫描 app/api 各 route.ts 中的 JSDoc @openapi 注解
 * 2. 扫描 openapi/types/api-types.ts 中的 TS 类型契约（@response/@query 引用源）
 * 3. 扫描 openapi/schemas.ts 中的 Zod 运行时校验 schema
 * 4. 生成 OpenAPI 契约到 public/docs/openapi.generated.yaml（唯一权威来源）
 *
 * 触发命令：
 * - pnpm openapi:generate   生成契约
 * - pnpm openapi:check      生成 + drift 检查（CI 门禁）
 * - pnpm openapi:ui         Redocly 本地预览
 *
 * 历史手工契约已归档至 docs/_archive/2026-09-18/openapi.yaml
 */
const config: PluginConfig = {
  schemaPaths: ["./openapi/schemas.ts", "./openapi/routes.ts"],
  outputPath: "./public/docs/openapi.generated.yaml",
  apiFilePath: "./app/api",
  schemaType: "zod",
  exportOpenAPI: true,
  docs: {
    title: "YYC³ NovaMind API",
    version: "2.0.0",
    description: "YYC³ NovaMind 全栈 API 契约（自动生成，SSOT）",
    serverUrl: "http://localhost:3218/api",
  },
}

export default config
