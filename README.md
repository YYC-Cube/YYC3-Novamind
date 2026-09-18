<div align="center">

<img src="/public/yyc3-Family.png" alt="YYC³ NovaMind" width="640" />

# YYC³ NovaMind

### 星图智语 · 新一代智能交互平台

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat-square)](https://ui.shadcn.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-latest-7B61FF?style=flat-square)](https://www.radix-ui.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2-729E1C?style=flat-square&logo=vitest)](https://vitest.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)

</div>

---

## ✨ 特性总览

| 模块 | 能力 | 状态 |
| :----- | :----- | :----: |
| 🤖 AI 对话 | 多轮对话 · 流式响应 · 多模型支持 | ✅ |
| 🧠 知识图谱 | 可视化图谱 · 智能关联 · 节点探索 | ✅ |
| 🗺️ 思维导图 | AI 生成 · 多主题 · 交互式编辑 | ✅ |
| 🎨 内容生成 | 海报 · PPT · 网页 · 一键生成 | ✅ |
| 📚 学习路径 | 个性化路径 · 进度追踪 · 评估系统 | ✅ |
| 👥 社区协作 | 内容分享 · 学习小组 · 实时协作 | ✅ |
| 📊 数据分析 | 使用分析 · 学习洞察 · 预测模型 | ✅ |
| 🔐 用户系统 | 注册登录 · 权限管理 · 安全认证 | ✅ |
| 📱 PWA | 离线支持 · 推送通知 · 全端安装 | ✅ |

---

## 🏗️ 技术架构

```
YYC³ NovaMind v2.0
├── Framework      Next.js 16.3 (App Router + RSC + Turbopack)
├── UI             React 19 + shadcn/ui + Radix UI
├── Styling        Tailwind CSS 3.4
├── Language       TypeScript 5.7 (Strict + 编译门禁 0 error)
├── State          React Hooks + Context
├── Forms          react-hook-form + zod
├── Charts         Recharts
├── AI             Vercel AI SDK 4 + @ai-sdk/openai 1
├── Icons          Lucide React (50+ UI components)
├── Testing        Vitest 2 + Testing Library 16 + Playwright 1.63
├── API Contract   next-openapi-gen (JSDoc → OpenAPI 3.0 SSOT)
├── CI/CD          GitHub Actions (typecheck + test + contract + build)
├── Package Mgr    pnpm 9
└── Deployment     Node.js 22 / Vercel
```

### 🗺️ 系统架构图

```mermaid
graph TB
  subgraph Client["📱 客户端 Client"]
        PWA["PWA Shell<br/>SW + Offline + Push"]
        UI["交互层<br/>语音 · 手势 · 多模态"]
  end
  subgraph App["⚡ Next.js 16 App Router"]
        Pages["52 页面路由<br/>对话 · 生成 · 学习 · 社区"]
        API["12 API 域<br/>ai · chat · auth · sync ..."]
        RSC["RSC + Turbopack<br/>流式渲染"]
  end
  subgraph Core["🧠 核心域 lib/ 60+ 模块"]
        AI["AI 引擎<br/>对话 · 预测 · 情绪"]
        Gen["内容生成<br/>PPT · 海报 · 网页 · 导图"]
        Learn["学习引擎<br/>路径 · 评估 · 图谱"]
        Infra["基础设施<br/>加密 · 错误处理 · CDN"]
  end
  subgraph Gate["🛡️ 质量门禁 CI"]
        TS["tsc --noEmit<br/>0 error"]
        VT["Vitest<br/>单测+覆盖率"]
        OA["OpenAPI Drift<br/>契约同源"]
        BL["next build<br/>52 页面"]
  end
  PWA & UI --> Pages
  Pages --> API
  API --> Core
  TS & VT & OA & BL -.->|每 push/PR| App
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
| **高扩展** | 模块化架构 · 插件系统 · API 路由 · 14+ 端点 | 模块复用率 ≥ 80% |
| **高智能** | AI 对话 · 知识图谱 · 预测模型 · 内容生成 | 多模型支持 |

---

## 📁 项目结构

```
yyc3-novamind/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── ai/                   # AI 接口
│   │   ├── chat/                 # 对话 (含流式)
│   │   ├── upload/               # 文件上传
│   │   ├── speech-to-text/       # 语音识别
│   │   └── analyze-image/        # 图像分析
│   ├── auth/                     # 认证页面
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
│   └── *.tsx                     # 业务组件
├── lib/                          # 核心业务逻辑
├── hooks/                        # 自定义 Hooks
├── public/
│   ├── yyc3-icons/               # 全端图标资源
│   │   ├── Android/              #   Android 多密度
│   │   ├── iOS/                  #   iOS 全尺寸
│   │   ├── Web App/              #   Web favicon + PWA
│   │   ├── macOS/                #   macOS 全尺寸
│   │   └── watchOS/              #   watchOS 全尺寸
│   └── yyc3-Family.png           # 品牌 Family 图
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.mjs
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 22.0
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
pnpm test           # Vitest 单元测试（一次性运行）
pnpm test:watch     # Vitest 监听模式
pnpm test:coverage  # Vitest + 覆盖率报告（v8 provider）
pnpm test:ui        # Vitest 交互式 UI
pnpm test:e2e       # Playwright E2E 测试
pnpm ci             # 全链路门禁：typecheck + test + build
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

## 🤝 参与贡献

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解贡献流程和行为准则。

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<div align="center">

**YYC³ NovaMind** · 言启千行代码，语枢万物智能

</div>
