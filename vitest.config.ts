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
        // 全局棘轮基线 — Phase D 收紧（2026-09-24，166 用例实测 9.6+）：
        // 前值 9/7.5/11.5/9 → 新增 context-engine.ts（19 用例）后整体抬升
        statements: 9.5,
        branches: 8,
        functions: 12,
        lines: 9.5,
        // 核心域逐文件硬门禁 — vitest 4 重校准（v4 口径较 v3 低 2~20 个百分点）
        'lib/auth.ts': { lines: 58, functions: 70 },
        'lib/conversation.ts': { lines: 76, functions: 73 },
        'lib/assessment.ts': { lines: 82, functions: 69 },
        'lib/ratings.ts': { lines: 90, functions: 85 },
        'lib/favorites.ts': { lines: 90, functions: 90 },
        'lib/mindmap.ts': { lines: 90, functions: 90 },
        'lib/local-llm-config.ts': { lines: 95, functions: 95 },
        // Phase A/B 新资产门禁
        'lib/api-guard.ts': { lines: 60, functions: 70 },
        // Phase D 资产 9：成本观测层
        'lib/usage.ts': { lines: 95, functions: 100 },
        // Phase D 资产 10：上下文工程
        'lib/context-engine.ts': { lines: 95, functions: 100 },
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
