/**
 * 资产 10 单测：上下文工程引擎
 * D10-5 验收：≥ 10 用例（分区边界/压缩率/降级/RAG 注入格式/工具结果裁剪）
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CONTEXT_WINDOW_BUDGET,
  RECENT_RATIO,
  buildContext,
  estimateContextTokens,
  formatKnowledgeContext,
  partitionContext,
  slidingWindowFallback,
  summarizeWithModel,
  truncateToolResultPart,
  truncateToolResults,
  type ContextPartition,
} from '@/lib/context-engine'

/** 造一条约 N token 的消息（2.5 char/token 口径 → 2.5N 字符，ceil） */
const msg = (role: 'user' | 'assistant' | 'system', tokens: number, tag = '') => ({
  role,
  content: `${tag}${'x'.repeat(Math.ceil(tokens * 2.5) - tag.length > 0 ? Math.ceil(tokens * 2.5) - tag.length : 0)}`,
})

describe('estimateContextTokens', () => {
  it('应复用资产 1 口径（2.5 char/token）累计消息 token', () => {
    const messages = [msg('user', 100), msg('assistant', 50)]
    expect(estimateContextTokens(messages)).toBe(150)
  })

  it('非字符串内容应计 0（健壮性）', () => {
    expect(estimateContextTokens([{ content: null }, { content: 42 }])).toBe(0)
  })
})

describe('partitionContext', () => {
  it('短对话不触发压缩：全部进 recent，older 为空', () => {
    const p = partitionContext([msg('user', 50), msg('assistant', 50)])
    expect(p.recent).toHaveLength(2)
    expect(p.older).toHaveLength(0)
    expect(p.needsSummary).toBe(false)
  })

  it('超窗长对话：近端全保，早期进 older 并标记 needsSummary', () => {
    const history = [
      msg('user', 600, 'old-1'),
      msg('assistant', 600, 'old-2'),
      msg('user', 100, 'recent-1'),
      msg('assistant', 100, 'recent-2'),
    ]
    // 近端预算 = 2000 * 0.5 = 1000；总 1400 超窗 → old-1 被挤出
    const p = partitionContext(history)
    expect(p.needsSummary).toBe(true)
    expect(p.older).toHaveLength(1)
    expect(p.older[0]!.content.startsWith('old-1')).toBe(true)
    expect(p.recent.map((m) => m.content.slice(0, 5))).toEqual(['old-2', 'recen', 'recen'])
    // recent 内 token 不超近端预算
    expect(estimateContextTokens(p.recent)).toBeLessThanOrEqual(1000)
  })

  it('压缩率：older 被挤出后 originalTokens 应显著大于 recent tokens', () => {
    const history = Array.from({ length: 10 }, (_, i) => msg('user', 300, `m${i}`))
    const p = partitionContext(history)
    expect(p.needsSummary).toBe(true)
    expect(p.estimatedTokens).toBe(3000)
    expect(estimateContextTokens(p.recent)).toBeLessThan(p.estimatedTokens / 2)
  })

  it('单条消息超近端预算也应保底进 recent（防空窗口）', () => {
    const p = partitionContext([msg('user', 5000)])
    expect(p.recent).toHaveLength(1)
    expect(p.older).toHaveLength(0)
  })

  it('边界：刚好等于预算不触发压缩', () => {
    const history = [msg('user', CONTEXT_WINDOW_BUDGET * RECENT_RATIO)]
    const p = partitionContext(history)
    expect(p.needsSummary).toBe(false)
  })
})

describe('slidingWindowFallback / summarizeWithModel', () => {
  it('滑动窗口降级：空 older 返回空串', () => {
    expect(slidingWindowFallback([])).toBe('')
  })

  it('滑动窗口降级：输出含省略条数与首条话题占位', () => {
    const older: ContextPartition['older'] = [msg('user', 50, '关于云原生的讨论')]
    const out = slidingWindowFallback(older)
    expect(out).toContain('1 条')
    expect(out).toContain('关于云原生的讨论')
  })

  it('summarizeWithModel 无 OPENAI_API_KEY 应抛错（调用方降级）', async () => {
    const key = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    try {
      await expect(summarizeWithModel([msg('user', 100)])).rejects.toThrow('OPENAI_API_KEY')
    } finally {
      if (key) process.env.OPENAI_API_KEY = key
    }
  })
})

describe('formatKnowledgeContext', () => {
  it('命中片段应格式化为 <knowledge> 区块并带 doc/score 标注', () => {
    const out = formatKnowledgeContext([
      { content: 'NovaMind 是智能应用平台', documentId: 'abcd1234-0000', score: 0.876 },
    ])
    expect(out).toContain('<knowledge>')
    expect(out).toContain('</knowledge>')
    expect(out).toContain('doc:abcd1234')
    expect(out).toContain('score:0.88')
    expect(out).toContain('NovaMind 是智能应用平台')
  })

  it('空片段返回空串（不注入）', () => {
    expect(formatKnowledgeContext([])).toBe('')
  })
})

describe('truncateToolResultPart / truncateToolResults', () => {
  it('超长 text 工具结果应截头保尾并返回 true', () => {
    const part = { output: { type: 'text', value: 'H'.repeat(2000) + 'T'.repeat(800) } }
    expect(truncateToolResultPart(part, 800)).toBe(true)
    const value = part.output.value as string
    expect(value).toContain('[...前文已截断...]')
    expect(value.endsWith('T'.repeat(800))).toBe(true)
    expect(value.length).toBeLessThan(830)
  })

  it('短结果与非 text 类型不裁剪（返回 false）', () => {
    expect(truncateToolResultPart({ output: { type: 'text', value: 'short' } }, 800)).toBe(false)
    expect(truncateToolResultPart({ output: { type: 'json', value: { a: 1 } } }, 800)).toBe(false)
  })

  it('truncateToolResults 应只处理 tool 角色消息并统计裁剪数', () => {
    const messages = [
      { role: 'user', content: 'hi' },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: '1', toolName: 't', output: { type: 'text', value: 'x'.repeat(3000) } },
          { type: 'tool-result', toolCallId: '2', toolName: 't', output: { type: 'text', value: 'tiny' } },
        ],
      },
      {
        role: 'assistant',
        content: [{ type: 'tool-result', toolCallId: '3', toolName: 't', output: { type: 'text', value: 'y'.repeat(3000) } }],
      },
    ] as unknown as Parameters<typeof truncateToolResults>[0]
    expect(truncateToolResults(messages)).toBe(1)
  })
})

describe('buildContext 集成', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.OPENAI_API_KEY
  })

  it('未超窗：不摘要、RAG 注入拼进 system、messages 保留原文', async () => {
    const history = [msg('user', 50), msg('assistant', 50)]
    const built = await buildContext(history, {
      system: '你是 NovaMind 助手',
      knowledgeContext: '<knowledge>片段</knowledge>',
    })
    expect(built.meta.summaryMode).toBe('none')
    expect(built.meta.knowledgeInjected).toBe(true)
    expect(built.system).toContain('你是 NovaMind 助手')
    expect(built.system).toContain('<knowledge>片段</knowledge>')
    // system 独立抽出，messages 内不含 system 角色
    expect(built.messages.every((m) => m.role !== 'system')).toBe(true)
    expect(built.messages).toHaveLength(2)
  })

  it('超窗 + 无 API Key：滑动窗口降级生效且压缩率 > 50%', async () => {
    const history = Array.from({ length: 8 }, (_, i) => msg('user', 400, `m${i}`))
    const built = await buildContext(history)
    expect(built.meta.summaryMode).toBe('sliding-window')
    expect(built.meta.summarizedCount).toBeGreaterThan(0)
    expect(built.system).toContain('<conversation_summary>')
    expect(built.system).toContain('已省略')
    // 压缩后 token 显著低于原始
    expect(built.meta.compressedTokens).toBeLessThan(built.meta.originalTokens / 2)
  })

  it('超窗 + 有 API Key：调用摘要模型并注入 <conversation_summary>', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const fake = vi.fn().mockResolvedValue({ text: ' 用户在讨论云原生部署。 ' })
    vi.doMock('ai', () => ({ generateText: fake }))
    vi.doMock('@ai-sdk/openai', () => ({ openai: vi.fn(() => 'mock-model') }))

    // 动态 import 拿到 mock 后的 buildContext
    const { buildContext: buildWithMock } = await import('@/lib/context-engine')
    const history = Array.from({ length: 8 }, (_, i) => msg('user', 400, `m${i}`))
    const built = await buildWithMock(history)

    expect(fake).toHaveBeenCalledOnce()
    expect(built.meta.summaryMode).toBe('model')
    expect(built.system).toContain('用户在讨论云原生部署。')
  })

  it('摘要模型调用失败：静默降级为滑动窗口', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const fake = vi.fn().mockRejectedValue(new Error('network down'))
    vi.doMock('ai', () => ({ generateText: fake }))
    vi.doMock('@ai-sdk/openai', () => ({ openai: vi.fn(() => 'mock-model') }))

    const { buildContext: buildWithMock } = await import('@/lib/context-engine')
    const history = Array.from({ length: 8 }, (_, i) => msg('user', 400, `m${i}`))
    const built = await buildWithMock(history)

    expect(built.meta.summaryMode).toBe('sliding-window')
    expect(built.system).toContain('已省略')
  })
})
