/**
 * 资产 9 单测：recordTokenUsage / getUsageSummary / MODEL_PRICING
 * D9-5 验收：≥ 8 用例（记录/聚合/降级/折算）
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  enabled: true,
  inserted: [] as Record<string, unknown>[],
  selectRows: [] as Record<string, unknown>[],
  shouldThrow: false,
}))

vi.mock('@/lib/db', () => {
  const makeChain = () => ({
    insert: () => ({
      values: async (v: Record<string, unknown>) => {
        if (mockState.shouldThrow) throw new Error('db down')
        mockState.inserted.push(v)
        return v
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: async () => {
                if (mockState.shouldThrow) throw new Error('db down')
                return mockState.selectRows
              },
            }),
          }),
        }),
      }),
    }),
  })
  return {
    get isDbEnabled() {
      return mockState.enabled
    },
    getDb: () => makeChain(),
  }
})

import { estimateCostUsd, getUsageSummary, MODEL_PRICING, recordTokenUsage, utcDateKey } from '@/lib/usage'

describe('utcDateKey', () => {
  it('应输出 UTC yyyy-mm-dd 冗余日期键', () => {
    expect(utcDateKey(new Date('2026-09-24T08:30:00Z'))).toBe('2026-09-24')
    expect(utcDateKey(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01')
  })
})

describe('recordTokenUsage', () => {
  beforeEach(() => {
    mockState.inserted = []
    mockState.shouldThrow = false
    mockState.enabled = true
  })

  it('DB 未启用时应静默降级返回 false（零成本禁用）', async () => {
    mockState.enabled = false
    const ok = await recordTokenUsage({
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 10,
      outputTokens: 20,
    })
    expect(ok).toBe(false)
    expect(mockState.inserted).toHaveLength(0)
  })

  it('成功记录：写入 provider/model/tokens/日期，无 userId 时为 null', async () => {
    const ok = await recordTokenUsage({
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 100,
      outputTokens: 50,
      latencyMs: 1234,
    })
    expect(ok).toBe(true)
    expect(mockState.inserted).toHaveLength(1)
    const row = mockState.inserted[0]!
    expect(row.provider).toBe('openai')
    expect(row.model).toBe('gpt-4o')
    expect(row.inputTokens).toBe(100)
    expect(row.outputTokens).toBe(50)
    expect(row.latencyMs).toBe(1234)
    expect(row.userId).toBeNull()
    expect(row.usageDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('负数与非整数 tokens 应截断归零，无 latency 时为 null', async () => {
    await recordTokenUsage({
      provider: 'openai',
      model: 'gpt-4o-mini',
      inputTokens: -5,
      outputTokens: 3.9,
    })
    const row = mockState.inserted[0]!
    expect(row.inputTokens).toBe(0)
    expect(row.outputTokens).toBe(3)
    expect(row.latencyMs).toBeNull()
  })

  it('DB 异常时应吞错返回 false（观测不阻塞业务）', async () => {
    mockState.shouldThrow = true
    const ok = await recordTokenUsage({
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 1,
      outputTokens: 1,
    })
    expect(ok).toBe(false)
  })
})

describe('estimateCostUsd', () => {
  it('已知模型应按 USD/1M 折算（gpt-4o：1M 输入 + 0.5M 输出 = 7.5 USD）', () => {
    expect(estimateCostUsd('gpt-4o', 1_000_000, 500_000)).toBeCloseTo(7.5, 6)
  })

  it('未知模型应折算为 0（定价未命中降级）', () => {
    expect(estimateCostUsd('unknown-model-x', 999_999, 999_999)).toBe(0)
  })

  it('MODEL_PRICING 应覆盖主力模型且输入单价低于输出单价', () => {
    for (const [model, p] of Object.entries(MODEL_PRICING)) {
      expect(p.input).toBeGreaterThan(0)
      expect(p.output).toBeGreaterThanOrEqual(p.input)
      expect(model.length).toBeGreaterThan(0)
    }
  })
})

describe('getUsageSummary', () => {
  beforeEach(() => {
    mockState.selectRows = []
    mockState.shouldThrow = false
    mockState.enabled = true
  })

  it('DB 未启用时应返回降级标记与空集', async () => {
    mockState.enabled = false
    const result = await getUsageSummary({ days: 7, groupBy: 'model' })
    expect(result.degraded).toBe(true)
    expect(result.rows).toHaveLength(0)
  })

  it('聚合行应派生 totalTokens / costUsd / avgLatencyMs', async () => {
    mockState.selectRows = [
      { groupKey: 'gpt-4o', provider: 'openai', model: 'gpt-4o', calls: 2, inputTokens: 1_000_000, outputTokens: 500_000, avgLatencyMs: 800 },
      { groupKey: 'custom', provider: 'openai', model: 'custom', calls: 1, inputTokens: 10_000, outputTokens: 1_000, avgLatencyMs: null },
    ]
    const result = await getUsageSummary({ days: 30, groupBy: 'model' })
    expect(result.degraded).toBe(false)
    expect(result.rows).toHaveLength(2)

    const first = result.rows[0]!
    expect(first.totalTokens).toBe(1_500_000)
    expect(first.costUsd).toBeCloseTo(7.5, 6)
    expect(first.avgLatencyMs).toBe(800)

    const second = result.rows[1]!
    expect(second.totalTokens).toBe(11_000)
    expect(second.costUsd).toBe(0)
    expect(second.avgLatencyMs).toBeNull()
  })

  it('空结果集应返回 degraded: false 与空行', async () => {
    const result = await getUsageSummary()
    expect(result.degraded).toBe(false)
    expect(result.rows).toHaveLength(0)
  })
})
