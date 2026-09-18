# 更新日志

YYC³ NovaMind 所有重要更改均记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.0] - 2026-09-18

### 新增

- **OpenAPI SSOT 单源契约**：14 个 API route.ts 全量 JSDoc `@openapi` 注解 → `next-openapi-gen` 自动生成 `public/docs/openapi.generated.yaml`
- Swagger UI 在线文档页 `/api-docs`（读取生成契约）
- Playwright E2E 基建：`@playwright/test 1.63.0` + `e2e/smoke.spec.ts` 冒烟测试
- CI OpenAPI 契约 drift 门禁（`openapi:check` 与 CI 同源）
- 开发者文档站 `docs/YYC3-Docs/`（MkDocs + Mermaid 双语可视化体系）
- 会话工作目录 `docs/yyc3-novamind-m3-20260918/`（审核 / 规划 / 日志 / 总结四件套）

### 变更

- **TypeScript 债务清零**：538 errors / 85 文件 → **0 error**（strict + noUnusedLocals + noUncheckedIndexedAccess 全门禁）
- 手工 OpenAPI 契约归档至 `docs/_archive/2026-09-18/`（735 行历史版本保留）
- 修复 `swagger-ui-react` 导入方式（default export）+ 本地类型 shim
- 修复 `calendar.tsx` Tailwind v4 语法不兼容（`--spacing(8)` → `2rem`）
- 重建 `/next-gen-interface` 页面（原文件无默认导出导致构建失败）
- CI 移除失效的 `next lint` 步骤（Next 16 已移除该命令）
- `next.config.mjs` 移除 Next 16 不再识别的 `eslint` 配置键

### 移除

- 12 个未使用变量/常量/导出（`_JWT_SECRET`、`__options`、`_CONTEXT_KEY` 等）

### 修复

- 30+ 处数组索引越界守卫（`noUncheckedIndexedAccess` 全量适配）
- 20+ 处 Partial 合并丢失必填字段的类型缺陷（统一 `existing + id` 恢复模式）
- vitest 误收集 e2e/ 目录导致 `pnpm test` 失败

## [1.0.0] - 2026-05-27

### 新增

- 项目正式命名为 **YYC³ NovaMind - 星图智语**
- AI 智能对话系统（多轮对话 · 流式响应）
- 知识图谱可视化与智能关联
- 思维导图 AI 生成与交互编辑
- 内容生成引擎（海报 · PPT · 网页）
- 个性化学习路径与进度追踪
- 社区协作（内容分享 · 学习小组）
- 数据分析仪表盘与学习洞察
- 用户认证与权限管理系统
- PWA 支持（离线 · 推送通知 · 全端安装）
- 50+ shadcn/ui 组件库
- 全端品牌图标适配（Android / iOS / macOS / watchOS / Web）

### 变更

- 项目名从 `my-v0-project` 重命名为 `yyc3-novamind`
- 全局品牌统一为 **YYC³ NovaMind**
- localStorage 存储键名统一为 `novamind-*` 前缀
- Next.js 升级至 14.2.35
- Radix UI 全系列升级至最新版本
- 全端图标资源迁移至 `yyc3-icons/` 目录
- 依赖版本全面升级

### 技术栈

- Next.js 14.2 (App Router)
- React 18 + TypeScript 5
- shadcn/ui + Radix UI + Tailwind CSS 3.4
- Vercel AI SDK + @ai-sdk/openai
- pnpm
