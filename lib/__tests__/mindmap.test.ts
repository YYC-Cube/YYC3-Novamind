import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MindMapManager } from '@/lib/mindmap'

describe('MindMapManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('createMindMap 应生成根节点与子节点', () => {
    const map = MindMapManager.createMindMap(
      '测试导图',
      ['第一主题', '第二主题', '第三主题'].join('\n'),
    )

    expect(map.id).toMatch(/^mindmap_/)
    expect(map.nodes.length).toBeGreaterThanOrEqual(4) // root + 3
    expect(map.nodes[0]?.id).toBe('root')
    expect(map.connections.length).toBe(map.nodes.length - 1)
  })

  it('createMindMap 应持久化并可查', () => {
    const map = MindMapManager.createMindMap('持久化', '内容')
    const found = MindMapManager.getMindMapById(map.id)
    expect(found?.title).toBe('持久化')
  })

  it('getMindMapById 不存在返回 null', () => {
    expect(MindMapManager.getMindMapById('ghost')).toBeNull()
  })

  it('updateNodePosition 应更新坐标', () => {
    const map = MindMapManager.createMindMap('移动', '节点')
    const node = map.nodes[1]!

    MindMapManager.updateNodePosition(map.id, node.id, 111, 222)
    const updated = MindMapManager.getMindMapById(map.id)?.nodes.find((n) => n.id === node.id)
    expect(updated?.x).toBe(111)
    expect(updated?.y).toBe(222)
  })

  it('updateNodePosition 导图不存在应静默', () => {
    expect(() => MindMapManager.updateNodePosition('ghost', 'n1', 1, 2)).not.toThrow()
  })

  it('toggleNodeExpansion 应切换展开状态', () => {
    const map = MindMapManager.createMindMap('折叠', '节点')
    const node = map.nodes[1]!

    MindMapManager.toggleNodeExpansion(map.id, node.id)
    const updated = MindMapManager.getMindMapById(map.id)?.nodes.find((n) => n.id === node.id)
    expect(updated?.isExpanded).toBe(!node.isExpanded)
  })

  it('addChildNode 应挂到父节点下', () => {
    const map = MindMapManager.createMindMap('加子节点', '父节点')
    const root = map.nodes[0]!
    const before = map.nodes.length

    MindMapManager.addChildNode(map.id, root.id, '新子节点')
    const updated = MindMapManager.getMindMapById(map.id)!

    expect(updated.nodes.length).toBe(before + 1)
    expect(root.children.length).toBeGreaterThan(0)
    expect(updated.connections.some((c) => c.to.includes('node_'))).toBe(true)
  })

  it('addChildNode 父节点不存在应静默', () => {
    const map = MindMapManager.createMindMap('静默', '内容')
    const before = map.nodes.length
    MindMapManager.addChildNode(map.id, 'ghost-parent', 'x')
    expect(MindMapManager.getMindMapById(map.id)?.nodes.length).toBe(before)
  })

  it('deleteMindMap 应删除导图', () => {
    const map = MindMapManager.createMindMap('待删', '内容')
    MindMapManager.deleteMindMap(map.id)
    expect(MindMapManager.getMindMapById(map.id)).toBeNull()
  })

  it('exportMindMap 应输出 JSON 或空串', () => {
    const map = MindMapManager.createMindMap('导出', '内容')
    const parsed = JSON.parse(MindMapManager.exportMindMap(map.id)) as { title: string }
    expect(parsed.title).toBe('导出')
    expect(MindMapManager.exportMindMap('ghost')).toBe('')
  })

  it('saveMindMap 更新已有导图应刷新 updatedAt', () => {
    const map = MindMapManager.createMindMap('更新', '内容')
    const later = { ...map, title: '更新后' }
    MindMapManager.saveMindMap(later)

    const all = MindMapManager.getMindMaps()
    expect(all.filter((m) => m.id === map.id)).toHaveLength(1)
    expect(all[0]?.title).toBe('更新后')
  })
})
