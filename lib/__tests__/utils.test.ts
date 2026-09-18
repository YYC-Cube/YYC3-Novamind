import { describe, it, expect } from 'vitest'
import { cn, gestureUtils } from '@/lib/utils'

describe('cn (className merger)', () => {
  it('应该合并多个 class 字符串', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('应该过滤 falsy 值', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar')
  })

  it('应该合并重复的 tailwind 类（保留后者）', () => {
    expect(cn('px-2 px-4')).toBe('px-4')
  })
})

describe('gestureUtils.calculateDistance', () => {
  it('应该正确计算两点欧氏距离', () => {
    expect(gestureUtils.calculateDistance(0, 0, 3, 4)).toBe(5)
    expect(gestureUtils.calculateDistance(1, 1, 1, 1)).toBe(0)
  })
})

describe('gestureUtils.calculateAngle', () => {
  it('水平向右应为 0°', () => {
    expect(gestureUtils.calculateAngle(0, 0, 1, 0)).toBeCloseTo(0)
  })

  it('垂直向上应为 -90°', () => {
    expect(gestureUtils.calculateAngle(0, 0, 0, -1)).toBeCloseTo(-90)
  })
})

describe('gestureUtils.getGestureType', () => {
  it('小位移应判定为 tap', () => {
    expect(gestureUtils.getGestureType(10, 10)).toBe('tap')
  })

  it('横向大位移应判定为 swipe-left/right', () => {
    expect(gestureUtils.getGestureType(100, 0)).toBe('swipe-right')
    expect(gestureUtils.getGestureType(-100, 0)).toBe('swipe-left')
  })

  it('纵向大位移应判定为 swipe-up/down', () => {
    expect(gestureUtils.getGestureType(0, 100)).toBe('swipe-down')
    expect(gestureUtils.getGestureType(0, -100)).toBe('swipe-up')
  })
})
