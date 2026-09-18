# 贡献指南

感谢你对 **YYC³ NovaMind** 的关注！欢迎参与项目贡献。

## 行为准则

- 尊重所有贡献者
- 建设性讨论和反馈
- 聚焦于对项目最有利的方案

## 开发流程

### 1. 环境准备

```bash
git clone https://github.com/your-org/yyc3-novamind.git
cd yyc3-novamind
pnpm install
pnpm dev -p 3074
```

### 2. 分支策略

- `main` — 稳定发布分支
- `dev` — 开发集成分支
- `feature/*` — 功能分支
- `fix/*` — 修复分支

### 3. 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 新增知识图谱导出功能
fix: 修复对话历史加载异常
docs: 更新 API 文档
style: 统一组件间距规范
refactor: 重构权限校验逻辑
perf: 优化首屏加载性能
test: 补充搜索模块单元测试
chore: 升级依赖版本
```

### 4. 代码规范

- TypeScript 严格模式，禁止 `any` 类型
- 使用 ESLint + 项目内置规则
- 组件遵循 shadcn/ui 组合模式
- Tailwind CSS 类名按一致顺序排列

### 5. Pull Request 流程

1. Fork 项目仓库
2. 从 `dev` 创建功能分支
3. 完成开发并自测
4. 提交 PR 至 `dev` 分支
5. 通过代码审查后合并

## 项目架构约定

### 文件组织

- 页面路由放在 `app/` 目录，遵循 Next.js App Router 约定
- 通用 UI 组件放在 `components/ui/`
- 业务组件放在 `components/`
- 业务逻辑和工具函数放在 `lib/`
- 自定义 Hooks 放在 `hooks/`

### 命名约定

- 文件名：kebab-case（`knowledge-graph.ts`）
- 组件名：PascalCase（`KnowledgeGraph`）
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE
- CSS 类：Tailwind utility classes

### 图标资源

全端品牌图标统一存放在 `public/yyc3-icons/`，按平台分目录：

```
yyc3-icons/
├── Android/      # mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi
├── iOS/          # 全尺寸适配
├── Web App/      # favicon + PWA 图标
├── macOS/        # 全尺寸
└── watchOS/      # 全尺寸
```
