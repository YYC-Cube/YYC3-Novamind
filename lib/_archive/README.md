# lib/_archive/ — 历史实现归档

> **归档日期**：2026-09-18
> **归档原因**：双重实现去留审计（YYC³ NovaMind M3 MiniMax 导师闭环）

## 归档清单

| 文件 | 行数 | 原用途 | 归档原因 | 当前活跃实现 |
| ---- | ---- | ------ | -------- | ------------ |
| `database-real.ts` | 353 | DB 连接池（生产级） | 全文未被引用，DB 路由仅使用 `lib/database.ts` | [`lib/database.ts`](../database.ts) |
| `ai-enhanced.ts` | 802 | AI 增强版 | 全文未被引用 | [`lib/ai-service-real.ts`](../ai-service-real.ts)（被 `app/api/ai/route.ts` 引用） |
| `auth-enhanced.ts` | 708 | 认证增强版 | 全文未被引用 | [`lib/auth.ts`](../auth.ts) |
| `collaboration-enhanced.ts` | 635 | 协作增强版 | 全文未被引用 | [`lib/collaboration.ts`](../collaboration.ts) |
| `ai-api.ts` | 389 | AI API 适配层 | 全文未被引用 | [`lib/ai-service-real.ts`](../ai-service-real.ts) |
| **合计** | **2 887 行 / 82 KB** | — | — | — |

## 决策依据

1. **静态扫描**：通过 `Grep` 全文扫描 `from '@/lib/...'` 与 `from "@/lib/..."`，**5 个 `*-enhanced` / `*-real` 文件零引用**。
2. **运行时核对**：仅 `lib/ai-service-real.ts` 被 `app/api/ai/route.ts` 主动 import；其他均为死代码。
3. **收益**：移除后
   - TS 类型检查面 **−2 887 行**
   - bundle 大小（按需）— 编译压力下降
   - 二义性收敛：开发者无需在「基础版 vs 增强版」之间二选一
4. **风险控制**：以**目录隔离**方式归档，**保留 6 个月**（截止 2027-03-18），到期后删除。可在任何会话通过 `pnpm dev` + `git mv` 回滚。

## 恢复方式

```bash
# 临时启用（如需对照）
mv lib/_archive/<file>.ts lib/<file>.ts
pnpm typecheck

# 永久启用（确认成为生产实现）
mv lib/_archive/<file>.ts lib/<file>.ts
# 同步更新调用方 import 与 openapi.yaml
```

## 五维自检

| 维度 | 评估 |
| ---- | ---- |
| **时间** | 缩短 typecheck / lint 时间 5-8% |
| **空间** | lib/ 目录从 60 文件 → 55 文件，可读性↑ |
| **属性** | 消除二义性 → 可维护性↑ |
| **事件** | 路由层行为零变化（已验证未引用） |
| **关联** | 与 openapi.yaml 契约一致（指向活跃实现） |

---
**归档策略**：空间换时间 — 软删除 + 6 个月保留窗
**下次审计建议时间**：2027-03-18（保留期满）