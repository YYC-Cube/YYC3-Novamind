---
file: 05-AI-SDK-v4-v5-迁移方案.md
description: YYC³ NovaMind AI SDK v4→v5 迁移方案 — 智能应用实现专家 — 20260918
author: AI Tutor <Intelligent Application Implementation Expert>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: active
tags: [migration],[ai-sdk],[v5],[plan]
category: plan
---

# 🔄 AI SDK v4 → v5 迁移方案

> 迁移动机：消除 `ai <5.0.52`（low）与 `@ai-sdk/provider-utils <3.0.28`（low）两个残留漏洞告警；对齐 Vercel AI SDK 主线（v5 已稳定，v4 进入维护期）。

## 一、使用面盘点（实测）

| 文件 | v4 API | 影响点 |
| ---- | ------ | ------ |
| [app/api/chat/route.ts](../../app/api/chat/route.ts) | `generateText` + `usage.promptTokens/completionTokens/totalTokens` | **usage 字段改名**（见 2.1） |
| [lib/ai-service-real.ts](../../lib/ai-service-real.ts) | `generateText`（`maxTokens`/`finishReason`）+ `streamText`（`textStream`）+ `openai(model)` | `maxTokens` 改名、`finishReason` 类型化、usage 嵌套 |
| [lib/webpage-generator.ts](../../lib/webpage-generator.ts) | `generateText`（`system`+`prompt`） | 仅需依赖升级，无 API 变更 |
| [app/api/analyze-image/route.ts](../../app/api/analyze-image/route.ts) | `generateText`（图像消息） | 图像 part 格式（`image` 字符串 v5 仍兼容） |
| [app/api/chat/stream/route.ts](../../app/api/chat/stream/route.ts) | 手写 SSE（OpenAI chunk 格式）+ [app/api/ai/route.ts](../../app/api/ai/route.ts) 同 | **零依赖 AI SDK，不受影响** |
| 前端组件 | 无 `useChat`/`useCompletion`（自研 fetch+SSE 解析） | **不受 UIMessage parts 重构影响** |

**结论**：项目未使用 tools/UIMessage/StreamData/createDataStream 等 v5 重灾区，迁移面收敛为 **3 个文件 / 5 个调用点**，属低风险快速迁移。

## 二、破坏性变更映射（仅列本项目命中的）

### 2.1 命中的变更

| v4 | v5 | 命中位置 |
| ---- | ---- | ---- |
| `maxTokens` | `maxOutputTokens` | ai-service-real.ts（generateText + streamText 两处） |
| `usage.promptTokens` / `usage.completionTokens` / `usage.totalTokens` | `usage.inputTokens` / `usage.outputTokens` / `usage.totalTokens`（tokens 字段为 `number \| undefined`） | chat/route.ts 的 OpenAI 兼容 usage 组装 |
| `finishReason: string` | `finishReason: FinishReason` 类型联合（`"stop" \| "length" \| "content-filter" \| "tool-calls" \| "error" \| "other" \| "unknown"`） | ai-service-real.ts 返回类型定义 |
| `zod ^3.24.1` peer | **`zod ^4.1.8+`**（官方推荐，避免 TS 性能问题） | package.json（项目 zod 同时承担表单校验，需回归 react-hook-form resolver） |

### 2.2 未命中但需知晓（未来扩展时）

- `CoreMessage` → `ModelMessage`、`convertToCoreMessages` → `convertToModelMessages`
- UIMessage `content` → `parts[]`、`Message` → `UIMessage`（前端未用 useChat，暂不涉及）
- `StreamData`/`createDataStreamResponse` 移除 → `createUIMessageStream`
- tool 定义 `parameters` → `inputSchema`、`args/result` → `input/output`
- `providerMetadata`（入参）→ `providerOptions`（返回值仍叫 providerMetadata）
- `toDataStreamResponse` → `toUIMessageStreamResponse` / `toTextStreamResponse`

## 三、迁移步骤

### Phase 1：依赖升级（原子提交）

```bash
# 1. 备份分支
git checkout -b feat/ai-sdk-v5-migration

# 2. 升级核心包（@ai-sdk/openai 1.x → 2.x，ai 4.x → 5.x）
pnpm add ai@^5 @ai-sdk/openai@^2

# 3. zod 升级（官方推荐 ≥4.1.8）
pnpm add zod@^4.1.8 @hookform/resolvers@latest

# 4. 清理残留漏洞告警（provider-utils 随之升至 3.x）
pnpm --registry=https://registry.npmjs.org audit
```

> ⚠️ zod v4 回归点：`@hookform/resolvers` 的 `zodResolver` 需 ≥5.0 版本；`lib/openapi/` 下 Zod schemas 供 `@asteasolutions/zod-to-openapi` 消费，需验证其 zod4 兼容性（≥7.3.0 已支持）。

### Phase 2：Codemod 自动迁移

```bash
# 官方 codemod 一键迁移（先跑通再人工复核）
npx @ai-sdk/codemod v5 lib/ app/
```

### Phase 3：手动修复（codemod 覆盖不到的）

**3.1 [lib/ai-service-real.ts](../../lib/ai-service-real.ts)**

```diff
- maxTokens: options.maxTokens || config.maxTokens,
+ maxOutputTokens: options.maxTokens || config.maxOutputTokens,
```

```diff
- finishReason: string
+ import type { FinishReason } from "ai"
+ finishReason: FinishReason
```

**3.2 [app/api/chat/route.ts](../../app/api/chat/route.ts)（usage 字段改名 + undefined 守卫）**

```diff
       usage: {
-        prompt_tokens: usage?.promptTokens ?? 0,
-        completion_tokens: usage?.completionTokens ?? 0,
+        prompt_tokens: usage?.inputTokens ?? 0,
+        completion_tokens: usage?.outputTokens ?? 0,
         total_tokens: usage?.totalTokens ?? 0,
```

**3.3 配置默认值语义**（[ai-service-real.ts](../../lib/ai-service-real.ts#L50-L72) 中 `maxTokens: 2000` 键名同步改为 `maxOutputTokens`，内部接口字段一并统一）

### Phase 4：验证门禁（不可跳过）

```bash
pnpm typecheck          # 0 error
pnpm lint               # 0 error
pnpm test               # 111 用例
pnpm openapi:check      # 契约同源
pnpm build              # 41+ 页面
# 手动冒烟：/chat 对话 · /generate/webpage 生成 · /analyze-image 图像分析
```

### Phase 5：收尾

```bash
git push origin feat/ai-sdk-v5-migration
# PR + CI 全绿后合入 main；CHANGELOG [Unreleased] 补登
```

## 四、风险与回滚

| 风险 | 概率 | 缓解 |
| ---- | ---- | ---- |
| zod v4 与 react-hook-form resolver 不兼容 | 中 | resolver 升级 + 表单页 E2E 冒烟；必要时暂缓 zod 升级（v5 的 zod3 兼容层可用但非推荐） |
| 本地 LLM（Ollama）自定义 fetch 路径行为差异 | 低 | ai-service-real.ts 本地分支走原生 fetch（未用 AI SDK），隔离良好 |
| finishReason 类型收窄导致比较逻辑报错 | 低 | typecheck 门禁兜底，逐处修复 |
| @asteasolutions/zod-to-openapi 与 zod4 冲突 | 中 | 若冲突：openapi schemas 保持 zod3 子集 + `@ai-sdk` 单独升级；或等 zod-to-openapi v8 |

**回滚方案**：`git revert` Phase 1 提交即可（单分支原子迁移，无持久化数据变更）。

## 五、预估工作量

| 阶段 | 工作量 |
| ---- | ---- |
| Phase 1-2（依赖+codemod） | 0.5h |
| Phase 3（手动修复 3 文件） | 0.5h |
| Phase 4（验证+冒烟） | 0.5h |
| **合计** | **~1.5h（单会话可完成）** |

---
*© 2026 YanYuCloudCube™ · 言启象限 | 语枢未来*
