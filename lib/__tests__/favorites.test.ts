import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FavoritesManager } from '@/lib/favorites'

const sample = {
  type: 'search' as const,
  title: '量子计算',
  content: '量子计算入门指南',
  tags: ['量子', '物理'],
}

describe('FavoritesManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('addToFavorites 应生成 id 与时间戳', () => {
    const fav = FavoritesManager.addToFavorites(sample)
    expect(fav.id).toBeTruthy()
    expect(fav.timestamp).toBeGreaterThan(0)
  })

  it('重复收藏相同内容应复用现有项', () => {
    const first = FavoritesManager.addToFavorites(sample)
    const second = FavoritesManager.addToFavorites({ ...sample, title: '改名' })

    expect(second.id).toBe(first.id)
    expect(FavoritesManager.getFavorites()).toHaveLength(1)
  })

  it('isFavorite / toggleFavorite 往返', () => {
    expect(FavoritesManager.isFavorite(sample.content, 'search')).toBe(false)
    expect(FavoritesManager.toggleFavorite(sample)).toBe(true)
    expect(FavoritesManager.isFavorite(sample.content, 'search')).toBe(true)
    expect(FavoritesManager.toggleFavorite(sample)).toBe(false)
  })

  it('removeFromFavorites 应删除指定项', () => {
    const fav = FavoritesManager.addToFavorites(sample)
    FavoritesManager.removeFromFavorites(fav.id)
    expect(FavoritesManager.getFavorites()).toHaveLength(0)
  })

  it('searchFavorites 应匹配标题/内容/标签/分类', () => {
    FavoritesManager.addToFavorites(sample)
    FavoritesManager.addToFavorites({ type: 'ppt', title: '健康食谱', content: '营养搭配' })

    expect(FavoritesManager.searchFavorites('量子')).toHaveLength(1)
    expect(FavoritesManager.searchFavorites('健康')).toHaveLength(1)
  })

  it('getFavoritesByType 应按类型过滤', () => {
    FavoritesManager.addToFavorites(sample)
    FavoritesManager.addToFavorites({ type: 'poster', title: '海报', content: '海报内容' })

    expect(FavoritesManager.getFavoritesByType('search')).toHaveLength(1)
    expect(FavoritesManager.getFavoritesByType('poster')).toHaveLength(1)
  })

  it('updateFavorite 应保留原 id', () => {
    const fav = FavoritesManager.addToFavorites(sample)
    FavoritesManager.updateFavorite(fav.id, { title: '新标题' })

    const updated = FavoritesManager.getFavorites()[0]
    expect(updated?.id).toBe(fav.id)
    expect(updated?.title).toBe('新标题')
  })

  it('addNoteToFavorite / rateFavorite 应写入 metadata', () => {
    const fav = FavoritesManager.addToFavorites(sample)
    FavoritesManager.addNoteToFavorite(fav.id, '稍后再看')
    FavoritesManager.rateFavorite(fav.id, 9)

    const updated = FavoritesManager.getFavorites()[0]
    expect(updated?.metadata?.notes).toBe('稍后再看')
    expect(updated?.metadata?.rating).toBe(5)
  })

  it('exportFavorites 应输出统计与列表', () => {
    FavoritesManager.addToFavorites(sample)
    const parsed = JSON.parse(FavoritesManager.exportFavorites()) as { totalItems: number }
    expect(parsed.totalItems).toBe(1)
  })

  it('importFavorites 应合并去重', () => {
    const fav = FavoritesManager.addToFavorites(sample)
    const payload = {
      favorites: [
        { ...fav, timestamp: new Date().toISOString() },
        { ...sample, title: '新内容', content: '另一条内容' },
      ],
    }

    expect(FavoritesManager.importFavorites(JSON.stringify(payload))).toBe(true)
    expect(FavoritesManager.getFavorites()).toHaveLength(2)
  })

  it('importFavorites 非法 JSON 返回 false', () => {
    expect(FavoritesManager.importFavorites('not-json')).toBe(false)
  })

  it('getStats 应输出分类统计', () => {
    FavoritesManager.addToFavorites({ ...sample, category: '科技' })

    const stats = FavoritesManager.getStats()
    expect(stats.total).toBe(1)
    expect(stats.byType['search']).toBe(1)
    expect(stats.byCategory['科技']).toBe(1)
  })

  it('clearFavorites 应清空', () => {
    FavoritesManager.addToFavorites(sample)
    FavoritesManager.clearFavorites()
    expect(FavoritesManager.getFavorites()).toHaveLength(0)
  })
})
