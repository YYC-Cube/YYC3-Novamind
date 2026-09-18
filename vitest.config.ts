import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'dist/**',
      'e2e/**',
      'playwright.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // 覆盖率口径 = 单测职责域（逻辑层）：lib + hooks
      // 页面/业务组件归 E2E 职责域（Playwright），不计入单测分母
      include: [
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
        'lib/_archive/**',
        '.next/**',
        'node_modules/**',
      ],
      thresholds: {
        // 全局棘轮基线（2026-09-18 P0 实测校准，下次迭代收紧至 15/72/72/15）
        statements: 7,
        branches: 70,
        functions: 70,
        lines: 7,
        // 核心域逐文件硬门禁（04 文档 P0：核心域覆盖率 ≥40%，实际达标 63%+）
        'lib/auth.ts': { lines: 60, functions: 70 },
        'lib/conversation.ts': { lines: 80, functions: 80 },
        'lib/assessment.ts': { lines: 85, functions: 90 },
        'lib/ratings.ts': { lines: 90, functions: 85 },
        'lib/favorites.ts': { lines: 90, functions: 90 },
        'lib/mindmap.ts': { lines: 90, functions: 90 },
        'lib/local-llm-config.ts': { lines: 95, functions: 95 },
      },
    },
    css: false,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
