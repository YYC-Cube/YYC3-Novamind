---
file: openapi.md
description: YYC³ NovaMind OpenAPI 契约说明 — M3 MiniMax 导师 — 2026-09-18
author: AI Tutor <MiniMax-M3>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: active
tags: [openapi],[contract],[api],[五维驱动]
category: spec
language: zh-CN
audience: developers,frontend,backend,integration
complexity: intermediate
trace_id: TRC-20260918-005
---

# 📡 OpenAPI 契约说明

> 配套 YAML：[openapi.yaml](./openapi.yaml)（OpenAPI 3.1.0）

## 一、契约覆盖范围

| 维度 | 数量 | 说明 |
| ---- | ---- | ---- |
| 路由文件 | 13 | `/Volumes/Max/YYC3-Novamind/app/api/**/route.ts` |
| 端点总数 | 30 | GET / POST / PUT / DELETE 全覆盖 |
| Schema | 8 | ApiResponse / ApiError / AI / Chat / Image / Auth 等 |
| 安全方案 | 2 | sessionCookie / bearerAuth |

## 二、契约生成流程

```
┌─────────────────────────────────────────────────────────┐
│  扫描 app/api/**/route.ts                                │
│         ↓                                               │
│  AST 解析 export async function {METHOD}                │
│         ↓                                               │
│  推断 path / method / request body / response schema    │
│         ↓                                               │
│  输出 openapi.yaml（OpenAPI 3.1）                        │
└─────────────────────────────────────────────────────────┘
```

> 本版本契约由 M3 MiniMax 导师基于源码扫描手工汇编，作为后续自动化生成（`@asteasolutions/zod-to-openapi` / `next-openapi-gen`）的基线。

## 三、五维契约原则

| 维度 | 实现 |
| ---- | ---- |
| **时间维** | 所有时间字段统一 ISO-8601 UTC（`format: date-time`） |
| **空间维** | 路径全部相对 baseURL，默认 `http://localhost:3218` |
| **属性维** | 所有响应含 `success: boolean`，错误码枚举与 `lib/error-handler.ts` 对齐 |
| **事件维** | 所有响应附 `trace_id`，便于端到端追踪 |
| **关联维** | 复杂资源可在 `data._links` 中声明关联（HAL 风格，可选） |

## 四、使用方式

### 4.1 命令行校验

```bash
# 安装 Redocly CLI
pnpm dlx @redocly/cli lint docs/openapi.yaml

# 输出 HTML 文档
pnpm dlx @redocly/cli build-docs docs/openapi.yaml --output docs/openapi.html
```

### 4.2 Swagger UI 本地预览

```bash
pnpm dlx swagger-ui-watcher docs/openapi.yaml
```

### 4.3 客户端代码生成

```bash
# TypeScript Fetch
pnpm dlx openapi-typescript docs/openapi.yaml -o types/api.d.ts

# React Query Hooks
pnpm dlx @openapi-codegen/cli generate \
  --input docs/openapi.yaml \
  --output lib/api-client \
  --client @tanstack/react-query
```

## 五、版本演进

| 版本 | 日期 | 主要变更 |
| ---- | ---- | -------- |
| v1.0.0 | 2026-09-18 | 初次生成，覆盖 13 路由 / 30 端点 |

## 六、下一步行动

1. **自动化**：引入 `next-openapi-gen` 在 build 时从 Zod schema 自动生成
2. **契约测试**：在 CI 增加 `schemathesis` 模糊测试
3. **Mock 服务**：使用 Prism 启动本地 mock，前后端并行开发
4. **SDK 发布**：将 TS 客户端发布至 `@yyc3/api-client` 内部 npm

---

**© 2025-2026 YYC³ Team. All Rights Reserved.**