# OpenAPI 自动生成迁移指南

> **目标**：以 `next-openapi-gen` + Zod schema 为契约源，替代手工汇编的 `docs/openapi.yaml`

## 一、当前状态

| 资产 | 状态 | 路径 |
| ---- | ---- | ---- |
| 手工契约 v1.0.0 | ✅ 当前生效 | [`docs/openapi.yaml`](../openapi.yaml) |
| Zod 种子 schema | ✅ 已落地 | [`schemas.ts`](./schemas.ts) + [`routes.ts`](./routes.ts) |
| `next-openapi-gen` 配置 | ✅ 已落地 | [`openapi.config.ts`](../openapi.config.ts) |
| 自动生成器 | 🟡 配置完成，待运行 | `pnpm openapi:generate` |

## 二、迁移路径

### Phase 1 — 双轨运行（当前）
- 手工 `docs/openapi.yaml` 为单一事实源（SSOT）。
- `openapi/schemas.ts` 累积 Zod 定义，与手工契约 1:1 对齐。
- 不修改 route.ts，零回归风险。

### Phase 2 — JSDoc 注解迁移（下一迭代）
在 `app/api/*/route.ts` 中逐步添加 JSDoc + Zod schema：

```typescript
import { z } from "zod"
import { extendZodWithOpenApi } from "next-openapi-gen"

extendZodWithOpenApi(z)

const ChatRequest = z.object({
  messages: z.array(z.object({ role: z.enum(["user","assistant","system"]), content: z.string() })),
  model: z.string().optional(),
}).openapi("ChatRequest")

/**
 * @openapi
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: 创建对话（流式 / 非流式）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 */
export async function POST(req: NextRequest) { ... }
```

### Phase 3 — 切换契约源（迁移完成）
- `pnpm openapi:generate` 生成 `docs/openapi.generated.yaml`
- 与 `docs/openapi.yaml` 对比 → `pnpm openapi:diff`
- 一致后，将 `generated.yaml` 重命名为 `openapi.yaml`（替换手工版）
- 在 CI 增加 `pnpm openapi:diff --check` 步骤，**任何偏离自动契约的路由 PR 必须解释**

## 三、依赖

| 包 | 用途 | 已添加 |
| ---- | ---- | ------ |
| `next-openapi-gen` | 扫描 + 生成 | ✅ devDep |
| `@asteasolutions/zod-to-openapi` | Zod ↔ OpenAPI 桥接 | ✅ dep |

## 四、CI 接入（待办）

```yaml
# .github/workflows/ci.yml 新增 step
- name: OpenAPI 契约校验
  run: |
    pnpm openapi:generate
    diff docs/openapi.generated.yaml docs/openapi.yaml
```

## 五、收益预估

| 指标 | 手工 v1 | 自动生成 v2 |
| ---- | ------- | ----------- |
| 维护成本 | 30 端点 × N 字段 | 0（路由即文档） |
| 漂移风险 | 高（接口改 / 文档忘改） | 0（编译时校验） |
| 类型安全 | 弱（YAML 无 TS 检查） | 强（Zod ↔ TS 双向） |
| Mock 生成 | 手动 | `pnpm dlx openapi-typescript` |

---

**下次审计**：Phase 2 启动前评审 → 路径选型确认。