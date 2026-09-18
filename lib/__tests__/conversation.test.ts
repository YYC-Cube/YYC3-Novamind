import { ConversationManager } from '@/lib/conversation'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('ConversationManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('createConversation 应创建带首条消息的对话', () => {
    const conv = ConversationManager.createConversation('你好世界', '测试主题')

    expect(conv.id).toMatch(/^conv-/)
    expect(conv.title).toBe('你好世界')
    expect(conv.messages).toHaveLength(1)
    expect(conv.messages[0]?.role).toBe('user')
    expect(conv.messages[0]?.content).toBe('你好世界')
    expect(conv.context.topic).toBe('测试主题')
    expect(conv.metadata.totalMessages).toBe(1)
  })

  it('createConversation 长标题应截断至 50 字符', () => {
    const long = 'a'.repeat(80)
    const conv = ConversationManager.createConversation(long)
    expect(conv.title).toBe('a'.repeat(50) + '...')
  })

  it('getConversation 应返回已保存的对话', () => {
    const created = ConversationManager.createConversation('查找我')
    const found = ConversationManager.getConversation(created.id)
    expect(found?.id).toBe(created.id)
  })

  it('getConversation 不存在时返回 null', () => {
    expect(ConversationManager.getConversation('nope')).toBeNull()
  })

  it('addMessage 应追加消息并更新元数据', () => {
    const conv = ConversationManager.createConversation('初始问题')
    ConversationManager.addMessage(conv.id, { role: 'assistant', content: '回答内容' })

    const updated = ConversationManager.getConversation(conv.id)
    expect(updated?.messages).toHaveLength(2)
    expect(updated?.metadata.totalMessages).toBe(2)
    expect(updated?.messages[1]?.role).toBe('assistant')
  })

  it('addMessage 对不存在对话应静默', () => {
    expect(() =>
      ConversationManager.addMessage('ghost', { role: 'user', content: 'x' }),
    ).not.toThrow()
  })

  it('addMessage 用户消息应合并关键词与标签', () => {
    const conv = ConversationManager.createConversation('学习编程')
    ConversationManager.addMessage(conv.id, { role: 'user', content: '再聊聊健康生活方式' })

    const updated = ConversationManager.getConversation(conv.id)
    // 中文连续串作为整体关键词提取
    expect(updated?.context.keywords).toContain('再聊聊健康生活方式')
  })

  it('generateSummary 应包含关键词与消息数', () => {
    const conv = ConversationManager.createConversation('探讨人工智能与机器学习')
    const summary = ConversationManager.generateSummary(conv.id)
    expect(summary).toContain('条消息')
  })

  it('generateSummary 不存在对话返回空串', () => {
    expect(ConversationManager.generateSummary('nope')).toBe('')
  })

  it('searchConversations 应按内容匹配', () => {
    ConversationManager.createConversation('量子计算入门')
    ConversationManager.createConversation('红烧肉做法')

    const results = ConversationManager.searchConversations('量子')
    expect(results).toHaveLength(1)
    expect(results[0]?.title).toContain('量子')
  })

  it('deleteConversation 应移除对话', () => {
    const conv = ConversationManager.createConversation('待删除')
    ConversationManager.deleteConversation(conv.id)
    expect(ConversationManager.getConversation(conv.id)).toBeNull()
  })

  it('createBranch 应基于父消息创建分支', () => {
    const conv = ConversationManager.createConversation('分支根')
    const parentId = conv.messages[0]!.id
    const branch = ConversationManager.createBranch(conv.id, parentId, '分支A')

    expect(branch.conversationId).toBe(conv.id)
    expect(branch.messages).toHaveLength(1)
    expect(ConversationManager.getBranches(conv.id)).toHaveLength(1)
  })

  it('createBranch 对话不存在应抛错', () => {
    expect(() => ConversationManager.createBranch('ghost', 'm1', 'x')).toThrow('对话不存在')
  })

  it('getConversations SSR 环境（无 window）返回空数组', () => {
    const original = globalThis.window
    // @ts-expect-error 模拟 SSR
    delete globalThis.window
    expect(ConversationManager.getConversations()).toEqual([])
    globalThis.window = original
  })

  it('exportConversation 应输出格式化 JSON', () => {
    const conv = ConversationManager.createConversation('导出测试')
    const json = ConversationManager.exportConversation(conv.id)
    const parsed = JSON.parse(json) as { title: string; messages: unknown[] }
    expect(parsed.title).toBe('导出测试')
    expect(parsed.messages).toHaveLength(1)
  })

  it('exportConversation 不存在对话返回空串', () => {
    expect(ConversationManager.exportConversation('nope')).toBe('')
  })

  it('对话上限 100 条应截断', () => {
    for (let i = 0; i < 103; i++) {
      ConversationManager.createConversation(`对话${i}`)
    }
    expect(ConversationManager.getConversations().length).toBeLessThanOrEqual(100)
  })
})
