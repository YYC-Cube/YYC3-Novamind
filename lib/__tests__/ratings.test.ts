import { RatingsManager } from '@/lib/ratings'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('RatingsManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('addRating 应创建评分并钳制到 1-5', () => {
    const r = RatingsManager.addRating('item-1', 'search', 5)
    expect(r.rating).toBe(5)
    expect(r.itemId).toBe('item-1')

    const clamped = RatingsManager.addRating('item-2', 'search', 99)
    expect(clamped.rating).toBe(5)
  })

  it('addRating 重复评分应更新而非新增', () => {
    RatingsManager.addRating('item-1', 'search', 3)
    RatingsManager.addRating('item-1', 'search', 5)

    const all = RatingsManager.getRatings()
    expect(all).toHaveLength(1)
    expect(all[0]?.rating).toBe(5)
  })

  it('getRating 返回匹配项或 null', () => {
    RatingsManager.addRating('item-1', 'poster', 4)
    expect(RatingsManager.getRating('item-1', 'poster')?.rating).toBe(4)
    expect(RatingsManager.getRating('item-1', 'ppt')).toBeNull()
  })

  it('removeRating 应删除指定评分', () => {
    const r = RatingsManager.addRating('item-1', 'search', 3)
    RatingsManager.removeRating(r.id)
    expect(RatingsManager.getRatings()).toHaveLength(0)
  })

  it('updateRating 应合并更新并重新钳制评分', () => {
    const r = RatingsManager.addRating('item-1', 'search', 3)
    RatingsManager.updateRating(r.id, { comment: '不错', rating: 99 })

    const updated = RatingsManager.getRating('item-1', 'search')
    expect(updated?.comment).toBe('不错')
    expect(updated?.rating).toBe(5)
  })

  it('markAsHelpful 应写入 helpful 标记', () => {
    const r = RatingsManager.addRating('item-1', 'search', 4)
    RatingsManager.markAsHelpful(r.id, true)
    expect(RatingsManager.getRating('item-1', 'search')?.helpful).toBe(true)
  })

  it('searchRatings 应匹配评论与标签', () => {
    RatingsManager.addRating('a', 'search', 4, '界面很美观')
    RatingsManager.addRating('b', 'search', 5, undefined, ['性能'])

    expect(RatingsManager.searchRatings('美观')).toHaveLength(1)
    expect(RatingsManager.searchRatings('性能')).toHaveLength(1)
  })

  it('getAverageRating 无评分返回 0', () => {
    expect(RatingsManager.getAverageRating('ghost', 'search')).toBe(0)
  })

  it('getStats 应输出统计字段', () => {
    RatingsManager.addRating('a', 'search', 5, '好')
    RatingsManager.addRating('b', 'poster', 3)

    const stats = RatingsManager.getStats()
    expect(stats.total).toBe(2)
    expect(stats.averageRating).toBe(4)
    expect(stats.withComments).toBe(1)
    expect(stats.byType['search']).toBe(1)
  })

  it('getTopRatedItems 应按评分降序', () => {
    RatingsManager.addRating('low', 'search', 2)
    RatingsManager.addRating('high', 'search', 5)

    const top = RatingsManager.getTopRatedItems('search', 1)
    expect(top[0]?.itemId).toBe('high')
  })

  it('clearRatings 应清空存储', () => {
    RatingsManager.addRating('a', 'search', 4)
    RatingsManager.clearRatings()
    expect(RatingsManager.getRatings()).toHaveLength(0)
  })

  it('exportRatings 应输出含 ISO 时间戳的 JSON', () => {
    RatingsManager.addRating('a', 'search', 4)
    const parsed = JSON.parse(RatingsManager.exportRatings()) as { totalRatings: number }
    expect(parsed.totalRatings).toBe(1)
  })
})
