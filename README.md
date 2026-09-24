<div align="center">

<img src="public/yyc3-Family.png" alt="YYC³ NovaMind — 言启象限 · 语枢未来" width="100%" />

# YYC³ NovaMind

### 星图智语 · 新一代 AI 全栈智能交互平台

**多模态 AI 对话 · 知识图谱 · 内容生成 · 学习路径 · 社区协作** —— 以「五维驱动」架构（五高 · 五标 · 五化）构建的全端 PWA 智能应用。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-50%2B%20components-000000?style=flat-square)](https://ui.shadcn.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Accessible%20Primitives-7B61FF?style=flat-square)](https://www.radix-ui.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4-729E1C?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362d59?style=flat-square&logo=sentry)](https://sentry.io/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)

[![CI](https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-Novamind/ci.yml?style=flat-square&label=CI%20Pipeline)](https://github.com/YYC-Cube/YYC3-Novamind/actions/workflows/ci.yml)
[![Typecheck](https://img.shields.io/badge/tsc%20--noEmit-0%20error-3DDC84?style=flat-square)](./package.json)
[![ESLint](https://img.shields.io/badge/ESLint%20flat--config-0%20error-4B32C3?style=flat-square&logo=eslint)](./eslint.config.mjs)
[![Tests](https://img.shields.io/badge/tests-136%20passed-3DDC84?style=flat-square&logo=vitest)](./lib/__tests__)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-SSOT%20Drift%20Gate-6BA539?style=flat-square&logo=openapiinitiative)](./public/docs/openapi.generated.yaml)
[![Coverage Gate](https://img.shields.io/badge/coverage-ratchet%20PASS-3DDC84?style=flat-square)](./vitest.config.ts)
[![MCP](https://img.shields.io/badge/MCP-Bidirectional-000000?style=flat-square)](./app/api/mcp/route.ts)

[![Node](https://img.shields.io/badge/node-%E2%89%A520.18-339933?style=flat-square&logo=nodedotjs)](./package.json)
[![Port](https://img.shields.io/badge/port-3218- blue?style=flat-square)](#-快速开始)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](./public/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)

</div>

---

## ✨ 特性总览

| 模块 | 能力 | 状态 |
| :----- | :----- | :----: |
| 🤖 AI 对话 | 多轮对话 · 流式响应 · 多模型支持 · 本地 LLM（Ollama 协议） | ✅ |
| 🛠️ Agentic 工具循环 | 四大能力工具化 · `runAgent` 多步控制（AI SDK v5 `stopWhen`） | ✅ |
| 🔌 MCP 双向接入 | 消费外部 MCP server（stdio/http/sse）· 供方端点反向暴露四工具 | ✅ |
| 🔄 Provider 路由 | 注册制多 Provider · 健康探针 · 链式故障转移 | ✅ |
| 📚 RAG 知识库 | pgvector 向量 + 全文双路检索 · RRF 融合 · DSN+APIKey 双降级 | ✅ |
| 💬 反馈闭环 | 消息级 👍/👎 · 幂等 upsert · 标注后台（Annotation 工作流） | ✅ |
| 🧠 知识图谱 | 可视化图谱 · 智能关联 · 节点探索 | ✅ |
| 🗺️ 思维导图 | AI 生成 · 多主题 · 交互式编辑 | ✅ |
| 🎨 内容生成 | 海报 · PPT · 网页 · 一键生成 | ✅ |
| 📚 学习路径 | 个性化路径 · 进度追踪 · 评估系统 | ✅ |
| 👥 社区协作 | 内容分享 · 学习小组 · 实时协作 | ✅ |
| 📊 数据分析 | 使用分析 · 学习洞察 · 预测模型 | ✅ |
| 🔐 用户系统 | Auth.js v5 · OAuth 可插拔 · 角色白名单 · API 会话闸门 | ✅ |
| 🛡️ 生产护栏 | 限流 · 消毒 · 成本闸三件套 · DSN 驱动 Sentry · 契约漂移门禁 | ✅ |
| 💾 持久化 | Drizzle ORM · 四表 + RAG 向量表 · DSN 驱动优雅降级 | ✅ |
| 📱 PWA | 离线支持 · 推送通知 · 全端安装 | ✅ |

---

## 🏗️ 技术架构

```
YYC³ NovaMind v2.0
├── Framework      Next.js 16 (App Router + RSC + Turbopack)
├── UI             React 19 + shadcn/ui + Radix UI
├── Styling        Tailwind CSS 3.4
├── Language       TypeScript 5.7 (Strict + 编译门禁 0 error)
├── State          React Hooks + Context
├── Forms          react-hook-form + zod
├── Charts         Recharts
├── AI             Vercel AI SDK 5 + @ai-sdk/openai 2 + @ai-sdk/mcp (MCP 双向) + 本地 LLM (Ollama 协议)
├── Icons          Lucide React (50+ UI components)
├── Testing        Vitest 4 + Testing Library 16 + Playwright 1.63
├── Monitoring     @sentry/nextjs 10 (DSN 驱动，双端 instrumentation)
├── Persistence    drizzle-orm + postgres (DSN 驱动降级) + pgvector (RAG)
├── Auth           Auth.js v5 (Credentials + GitHub/Google 可插拔)
├── API Contract   next-openapi-gen (JSDoc @openapi → OpenAPI 3.0 SSOT)
├── CI/CD          GitHub Actions (install → quality[lint+契约+单测] → build)
├── Package Mgr    pnpm 9
└── Deployment     Node.js ≥ 20.18 (CI 22) / Vercel
```

### 🗺️ 系统架构图

```mermaid
graph TB
  subgraph Client["📱 客户端 Client"]
        PWA["PWA Shell<br/>SW + Offline + Push"]
        UI["交互层<br/>语音 · 手势 · 多模态"]
        SENTRY_C["Sentry 浏览器端<br/>错误 + 回放"]
  end
  subgraph App["⚡ Next.js 16 App Router"]
        Pages["57 页面/路由<br/>对话 · 生成 · 学习 · 社区 · 标注后台"]
        API["16 API 域<br/>ai · chat · mcp · feedback · auth ..."]
        RSC["RSC + Turbopack<br/>流式渲染"]
        SENTRY_S["Sentry 服务端<br/>onRequestError"]
  end
  subgraph Core["🧠 核心域 lib/（八资产闭环）"]
        GUARD["资产1 护栏<br/>限流 · 消毒 · 成本闸"]
        DB["资产2 持久化<br/>Drizzle DSN 降级"]
        AUTH["资产3 Auth.js v5<br/>API 会话闸门"]
        TOOLS["资产5 工具循环<br/>runAgent · stopWhen"]
        ROUTE["资产4 Provider 路由<br/>链式故障转移"]
        RAG["资产6 RAG<br/>pgvector + RRF"]
        MCP["资产7 MCP 双向<br/>client + 供方端点"]
        FB["资产8 反馈闭环<br/>Annotation 后台"]
  end
  subgraph Gate["🛡️ 质量门禁 CI（三阶段）"]
        TS["tsc --noEmit<br/>0 error"]
        LINT["ESLint flat config<br/>0 error + 豁免棘轮"]
        VT["Vitest<br/>136 用例 + 覆盖率棘轮"]
        OA["OpenAPI Drift<br/>契约同源"]
        BL["next build<br/>57 路由"]
  end
  PWA & UI --> Pages
  Pages --> API
  API --> Core
  SENTRY_C & SENTRY_S -.->|错误上报| Sentry["Sentry 平台<br/>DSN 驱动"]
  TS & LINT & VT & OA & BL -.->|每 push/PR| App
```

### 🔄 API 契约数据流（SSOT）

```mermaid
flowchart LR
  J["route.ts<br/>JSDoc @openapi"] -->|"pnpm openapi:generate"| Y["public/docs/<br/>openapi.generated.yaml"]
  Y --> S["/api-docs<br/>Swagger UI"]
  Y --> R["openapi:ui<br/>Redocly"]
  Y --> C["CI drift 门禁<br/>git diff --exit-code"]
```

### 🎯 五维驱动架构

| 维度 | 核心实践 | 度量指标 |
| :----- | :----- | :----- |
| **高可用** | PWA Service Worker · 错误边界 · 优雅降级 | 99.9% 可用性 |
| **高性能** | 包导入优化 · RSC · 流式响应 · 图片优化(AVIF/WebP) | Lighthouse ≥ 90 |
| **高安全** | zod 校验 · 权限系统 · 数据加密 · CSP 安全头 | OWASP Top 10 覆盖 |
| **高扩展** | 模块化架构 · 插件系统 · API 路由 · 29 端点 | 模块复用率 ≥ 80% |
| **高智能** | AI 对话 · 知识图谱 · 预测模型 · 内容生成 | 多模型支持 |

---

## 📁 项目结构

```
yyc3-novamind/
├── app/                          # Next.js App Router
│   ├── api/                      # 16 API 域
│   │   ├── chat/                 #   对话 (含 stream 流式)
│   │   ├── mcp/                  #   MCP 供方端点 (JSON-RPC 2.0)
│   │   ├── feedback/             #   反馈闭环 (upsert/查询/标注)
│   │   ├── ai/                   #   AI 接口
│   │   ├── auth/                 #   Auth.js v5 + 认证接口
│   │   ├── sync/                 #   跨端同步
│   │   ├── upload/               #   文件上传
│   │   ├── speech-to-text/       #   语音识别
│   │   └── analyze-image/        #   图像分析
│   ├── api-docs/                 # Swagger UI 契约可视化
│   ├── auth/                     # 认证页面 (登录/注册/找回密码)
│   ├── admin/feedback/           # 反馈标注后台 (Annotation)
│   ├── search/                   # 智能搜索
│   ├── conversations/            # 对话管理
│   ├── knowledge-graph/          # 知识图谱
│   ├── learning-path/            # 学习路径
│   ├── generate/                 # 内容生成
│   │   ├── mindmap/              #   思维导图
│   │   ├── poster/               #   海报生成
│   │   ├── ppt/                  #   PPT 生成
│   │   └── webpage/              #   网页生成
│   ├── community/                # 社区
│   ├── analytics/                # 数据分析
│   ├── admin/                    # 管理后台
│   ├── settings/                 # 系统设置
│   └── layout.tsx                # 根布局
├── components/
│   ├── ui/                       # shadcn/ui 组件 (50+)
│   └── *.tsx                     # 业务组件 (协作/分析/主题)
├── lib/                          # 核心业务逻辑
│   ├── ai-tools.ts               #   Agentic 工具注册表 + runAgent 循环 (资产5)
│   ├── ai-service-real.ts        #   Provider 注册制 + 链式故障转移 (资产4)
│   ├── rag.ts                    #   RAG 分块/入库/RRF 混合检索 (资产6)
│   ├── mcp/client.ts             #   MCP 消费方 client 层 (资产7)
│   ├── api-guard.ts              #   限流/消毒/成本闸三件套 (资产1)
│   ├── db/                       #   Drizzle schema + DSN 降级 (资产2)
│   ├── __tests__/                #   单元测试 (136 用例)
│   └── _archive/                 #   归档区 (6 个月保留窗)
├── hooks/                        # 自定义 Hooks
├── openapi/                      # 契约源 (Zod schemas + 类型)
├── drizzle/                      # 迁移模板 (0000-rag-pgvector.sql)
├── auth.config.ts                # Auth.js v5 服务端配置 (资产3)
├── middleware.ts                 # 边缘中间件 (API 写路由会话闸门)
├── instrumentation.ts            # Sentry 服务端 (DSN 驱动)
├── instrumentation-client.ts     # Sentry 浏览器端
├── eslint.config.mjs             # ESLint flat config (0 error + 豁免棘轮)
├── lint-legacy-allowlist.json    # 存量豁免清单 (只减不增)
├── e2e/                          # Playwright E2E
├── docs/                         # YYC3-Docs 文档站 + 会话存档
├── public/
│   ├── docs/                     # openapi.generated.yaml (SSOT)
│   ├── yyc3-icons/               # 全端图标资源
│   │   ├── Android/              #   Android 多密度
│   │   ├── iOS/                  #   iOS 全尺寸
│   │   ├── Web App/              #   Web favicon + PWA
│   │   ├── macOS/                #   macOS 全尺寸
│   │   └── watchOS/              #   watchOS 全尺寸
│   ├── sw.js                     # Service Worker (PWA 离线)
│   ├── manifest.json             # PWA 清单
│   └── yyc3-Family.png           # 品牌 Family 图
├── package.json
├── tsconfig.json
├── vitest.config.ts              # 覆盖率双轨门禁
└── next.config.mjs
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20.18.0（推荐 22，与 CI 一致）
- pnpm ≥ 9.0

### 安装

```bash
# 克隆项目
git clone https://github.com/YYC-Cube/YYC3-Novamind.git
cd YYC3-Novamind

# 安装依赖
pnpm install

# 启动开发服务器（默认端口 3218）
pnpm dev
```

访问 **<http://localhost:3218>**

### 常用命令

```bash
pnpm dev            # 开发服务器（端口 3218）
pnpm build          # 生产构建（Turbopack + TS 编译门禁）
pnpm start          # 启动生产服务（端口 3218）
pnpm typecheck      # TypeScript 严格编译门禁（0 error 基线）
pnpm lint           # ESLint flat config（0 error 门禁）
pnpm test            # Vitest 单元测试（136 用例）
pnpm test:watch      # Vitest 监听模式
pnpm test:coverage   # 覆盖率报告 + 双轨门禁（全局棘轮 + 逐文件硬门禁）
pnpm test:ui        # Vitest 交互式 UI
pnpm test:e2e        # Playwright E2E 测试
pnpm ci              # 全链路门禁：typecheck + lint + test + build
```

### 环境配置（密钥与数据库）

```bash
cp .env.example .env.local       # 从模板创建本地环境

# 生成会话密钥（Auth.js v5 必需）
openssl rand -base64 32          # 输出值填入 .env.local 的 AUTH_SECRET

# 数据库（可选，DSN 驱动降级：不配置则以内存态运行）
# .env.local 填入 DATABASE_URL 后：
pnpm db:migrate                              # 四表迁移 (users/chats/messages/feedback)
psql "$DATABASE_URL" -f drizzle/0000-rag-pgvector.sql   # RAG 向量表 (documents/chunks + HNSW/GIN)
```

> 完整命令手册（含占位符说明、生产供给清单、一键校验脚本）：[docs/07-生产供给配置手册.md](./docs/yyc3-novamind-m3-20260918/07-生产供给配置手册.md)

### 监控接入（Sentry，可选）

错误监控采用 **DSN 驱动**设计——不配置则完全静默，零开销：

```bash
# .env.local 填入 NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN 即激活
```

### MCP 生态（资产 7）

NovaMind 同时是 MCP **消费方**与**供方**：

```bash
# 消费外部 MCP server：.env.local 配置（JSON 数组）
# MCP_SERVERS=[{"name":"fs","type":"stdio","commandOrUrl":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/tmp"]}]

# 供方端点：POST /api/mcp（JSON-RPC 2.0：initialize → tools/list → tools/call）
# 可被 Claude Desktop / Cursor 等任意 MCP host 作为工具服务器消费
```

### API 契约（SSOT 单源）

OpenAPI 契约由代码 JSDoc 注解自动生成，**禁止手工编辑**：

```bash
pnpm openapi:generate   # 从 route.ts JSDoc 生成 public/docs/openapi.generated.yaml
pnpm openapi:check      # 生成 + git diff 校验（CI drift 门禁同源）
pnpm openapi:ui         # Redocly 本地预览契约文档
```

- 在线 Swagger UI：启动开发服务器后访问 **<http://localhost:3218/api-docs>**
- 契约规范：所有 `app/api/**/route.ts` 必须携带 `@openapi` JSDoc 注解（GET/POST/PATCH/DELETE 全覆盖）

---

## 🎯 五维架构体系

YYC³ NovaMind 遵循 **五维驱动** 架构理念：

| 维度 | 实践 |
| :----- | :----- |
| **高可用** | PWA 离线支持 · 错误边界 · 优雅降级 |
| **高性能** | 包导入优化 · 按需编译 · 流式响应 |
| **高安全** | 表单验证(zod) · 权限系统 · 数据加密 |
| **高扩展** | 插件系统 · 模块化架构 · API 路由 |
| **高智能** | AI 对话 · 知识图谱 · 预测模型 · 内容生成 |

---

## 📚 开发者文档导航

| 文档 | 说明 |
| :----- | :----- |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录（v2.0.0 全量交付清单） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献流程与行为准则 |
| [docs/YYC3-Docs/](./docs/YYC3-Docs/) | MkDocs 文档站（架构 / CICD / 发布 / 风格指南） |
| [docs/yyc3-novamind-m3-20260918/](./docs/yyc3-novamind-m3-20260918/) | 会话四件套 + 审核报告 + 同类项目对标资产文档（八资产闭环） |
| [docs/…/07-生产供给配置手册.md](./docs/yyc3-novamind-m3-20260918/07-生产供给配置手册.md) | 密钥生成 / 数据库配置 / 生产供给命令（占位符版） |
| [.env.example](./.env.example) | 环境变量模板（Sentry / AI / MCP / RAG） |
| `/api-docs`（dev 模式） | Swagger UI 在线契约 |

---

## 🤝 参与贡献

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解贡献流程和行为准则。

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<div align="center">

**YYC³ NovaMind** · 言启千行代码，语枢万物智能

*© 2026 YanYuCloudCube™ · 言启象限 | 语枢未来*

</div>
