import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'
import { readFileSync } from 'node:fs'

// 存量豁免清单（棘轮：只减不增）— Phase C 治理（2026-09-20）时从实测 warning 快照生成。
// 修复文件后从 JSON 中删除对应条目即可；新文件不在清单内，直接 error。
const allowlist = JSON.parse(readFileSync(new URL('./lint-legacy-allowlist.json', import.meta.url), 'utf8'))

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'public/**',
      'lib/_archive/**',
      'docs/**',
      'next.config.mjs',
      'postcss.config.mjs',
      '*.gen.*',
      // 生成物：openapi 类型由 next-openapi-gen 链路产出，不参与 lint 治理
      'openapi/types/**',
    ],
  },
  ...coreWebVitals,
  {
    // 复用 eslint-config-next 内置插件实例（react-hooks / @typescript-eslint / react）
    plugins: {
      '@typescript-eslint': typescript[0].plugins['@typescript-eslint'],
      'react-hooks': coreWebVitals.find((c) => c.plugins?.['react-hooks'])?.plugins['react-hooks'],
      react: coreWebVitals.find((c) => c.plugins?.react)?.plugins.react,
    },
    rules: {
      // 渐进收紧：no-unused-vars 作为 error 守住"无死代码"基线
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Phase C 深水区：默认 error（增量零容忍），存量豁免文件由下方 override 降为 warn
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React Compiler v6 规则：默认 error，存量豁免文件由下方 override 降为 warn
      'react-hooks/immutability': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      // 已全量修复（34 处 JSX 裸引号 → 实体），error 防止回潮
      'react/no-unescaped-entities': 'error',
    },
  },
  // ── 存量豁免 override：仅清单内文件降为 warn（棘轮只减不增）──
  // 注：动态路由路径含 [id]，glob 会视为字符类，必须转义才能字面匹配
  {
    files: allowlist.anyFiles.map((f) => `**/${f.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}`),
    rules: { '@typescript-eslint/no-explicit-any': 'warn' },
  },
  {
    files: allowlist.hooksFiles.map((f) => `**/${f.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}`),
    rules: {
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
