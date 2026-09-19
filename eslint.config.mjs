import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

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
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // React Compiler v6 新增规则：存量代码噪音大，降级 warn 观察一轮后逐步转 error
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      // 已全量修复（34 处 JSX 裸引号 → 实体），转 error 防止回潮
      'react/no-unescaped-entities': 'error',
    },
  },
]

export default eslintConfig
