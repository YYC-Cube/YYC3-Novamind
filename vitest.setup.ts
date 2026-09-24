import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 每个测试后自动清理 DOM
afterEach(() => {
  cleanup()
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => {
    const React = require('react')
    return React.createElement('img', props)
  },
}))

// Mock next-auth：避免 auth.config.ts 传递引入 next/server 的 ESM 解析问题（vitest v4 环境）
vi.mock('next-auth', () => {
  const auth = vi.fn(async () => null)
  return {
    default: vi.fn(() => ({ handlers: {}, auth, signIn: vi.fn(), signOut: vi.fn() })),
    auth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
})

// 环境变量占位
process.env.NEXT_PUBLIC_APP_NAME = 'YYC³ NovaMind'
process.env.NEXT_PUBLIC_APP_VERSION = '2.0.0'
