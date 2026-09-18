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
    // 复用 eslint-config-next 内置的 typescript-eslint 插件实例
    plugins: { '@typescript-eslint': typescript[0].plugins['@typescript-eslint'] },
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
      'react/no-unescaped-entities': 'warn',
    },
  },
]

export default eslintConfig
