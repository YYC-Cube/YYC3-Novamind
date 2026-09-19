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
        // 全局棘轮基线 — vitest 4 重校准（2026-09-19）：
        // v4 采用 ast-v8-to-istanbul 严格重映射且全量 include 文件计入分母，
        // 与 v3"仅执行文件"口径不可比，按 v4 实测（8.04/6.49/10.1/8）落位；
        // 下次迭代收紧至 statements/lines 15+
        statements: 7,
        branches: 6,
        functions: 9,
        lines: 7,
        // 核心域逐文件硬门禁 — vitest 4 重校准（v4 口径较 v3 低 2~20 个百分点）
        'lib/auth.ts': { lines: 58, functions: 70 },
        'lib/conversation.ts': { lines: 76, functions: 73 },
        'lib/assessment.ts': { lines: 82, functions: 69 },
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
