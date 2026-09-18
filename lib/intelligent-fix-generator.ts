/**
 * 智能修复建议和代码生成系统
 */

interface CodeFix {
  id: string
  issueId: string
  type: 'code-replacement' | 'code-addition' | 'config-change' | 'dependency-update'
  title: string
  description: string
  beforeCode?: string
  afterCode?: string
  filePath?: string
  automated: boolean
  confidence: number // 0-100
  estimatedImpact: 'low' | 'medium' | 'high'
  tags: string[]
}

interface AutoFixSuggestion {
  id: string
  category: string
  fixes: CodeFix[]
  priority: number
  canAutoApply: boolean
  requiresReview: boolean
}

export class IntelligentFixGenerator {
  private static readonly COMMON_FIXES: Record<string, CodeFix[]> = {
    'accessibility': [
      {
        id: 'add-aria-labels',
        issueId: 'accessibility-missing-labels',
        type: 'code-replacement',
        title: '添加 ARIA 标签',
        description: '为交互元素添加无障碍访问标签',
        beforeCode: '<button onClick={handleClick}>提交</button>',
        afterCode: '<button onClick={handleClick} aria-label="提交表单">提交</button>',
        filePath: 'components/ui/button.tsx',
        automated: true,
        confidence: 95,
        estimatedImpact: 'medium',
        tags: ['accessibility', 'aria', 'a11y']
      },
      {
        id: 'add-alt-text',
        issueId: 'accessibility-missing-alt',
        type: 'code-replacement',
        title: '添加图片 alt 属性',
        description: '为图片添加描述性文字',
        beforeCode: '<img src="/logo.png" />',
        afterCode: '<img src="/logo.png" alt="公司标志" />',
        automated: true,
        confidence: 90,
        estimatedImpact: 'high',
        tags: ['accessibility', 'images', 'alt-text']
      }
    ],
    'performance': [
      {
        id: 'optimize-images',
        issueId: 'performance-large-images',
        type: 'code-replacement',
        title: '使用 Next.js Image 优化',
        description: '将普通图片标签替换为优化的 Next.js Image 组件',
        beforeCode: '<img src="/banner.jpg" width={800} height={400} />',
        afterCode: `import Image from 'next/image'
        
<Image 
  src="/banner.jpg" 
  width={800} 
  height={400} 
  alt="Banner image"
  priority
/>`,
        automated: false,
        confidence: 98,
        estimatedImpact: 'high',
        tags: ['performance', 'images', 'next.js']
      },
      {
        id: 'add-lazy-loading',
        issueId: 'performance-no-lazy-loading',
        type: 'code-addition',
        title: '添加懒加载',
        description: '为非关键组件添加懒加载功能',
        afterCode: `import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LazyComponent />
    </Suspense>
  )
}`,
        automated: false,
        confidence: 85,
        estimatedImpact: 'medium',
        tags: ['performance', 'lazy-loading', 'react']
      }
    ],
    'security': [
      {
        id: 'sanitize-html',
        issueId: 'security-xss-risk',
        type: 'code-replacement',
        title: '添加 HTML 清理',
        description: '对用户输入进行安全清理，防止 XSS 攻击',
        beforeCode: '<div dangerouslySetInnerHTML={{__html: userContent}} />',
        afterCode: `import DOMPurify from 'isomorphic-dompurify'

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />`,
        automated: false,
        confidence: 100,
        estimatedImpact: 'high',
        tags: ['security', 'xss', 'sanitization']
      },
      {
        id: 'add-csp-headers',
        issueId: 'security-missing-csp',
        type: 'config-change',
        title: '添加内容安全策略',
        description: '配置 CSP 头部以增强安全性',
        afterCode: `// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}`,
        filePath: 'next.config.js',
        automated: false,
        confidence: 90,
        estimatedImpact: 'high',
        tags: ['security', 'csp', 'headers']
      }
    ],
    'code-quality': [
      {
        id: 'add-error-boundary',
        issueId: 'code-quality-no-error-handling',
        type: 'code-addition',
        title: '添加错误边界',
        description: '为组件添加错误边界来优雅处理异常',
        afterCode: `'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            出现了一些问题
          </h2>
          <p className="text-gray-600">
            页面遇到了错误，请刷新页面重试。
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary`,
        filePath: 'components/ErrorBoundary.tsx',
        automated: false,
        confidence: 95,
        estimatedImpact: 'medium',
        tags: ['error-handling', 'react', 'robustness']
      },
      {
        id: 'add-loading-states',
        issueId: 'code-quality-no-loading-states',
        type: 'code-replacement',
        title: '添加加载状态',
        description: '为异步操作添加加载状态指示',
        beforeCode: `const handleSubmit = async () => {
  const result = await api.submitData(data)
  setResult(result)
}`,
        afterCode: `const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    const result = await api.submitData(data)
    setResult(result)
  } catch (error) {
    console.error('提交失败:', error)
    // 处理错误
  } finally {
    setIsLoading(false)
  }
}

// 在 JSX 中
<button disabled={isLoading}>
  {isLoading ? '提交中...' : '提交'}
</button>`,
        automated: false,
        confidence: 90,
        estimatedImpact: 'medium',
        tags: ['ux', 'loading', 'async']
      }
    ]
  }

  // 生成智能修复建议
  static generateFixSuggestions(issues: any[]): AutoFixSuggestion[] {
    const suggestions: AutoFixSuggestion[] = []
    
    // 按类别分组问题
    const issuesByCategory = issues.reduce((acc: Record<string, any[]>, issue) => {
      const category = this.getCategoryFromIssue(issue)
      if (!acc[category]) acc[category] = []
      acc[category].push(issue)
      return acc
    }, {} as Record<string, any[]>)

    // 为每个类别生成修复建议
    Object.entries(issuesByCategory).forEach(([category, categoryIssues]) => {
      const fixes = this.getFixesForCategory(category, categoryIssues ?? [])
      
      if (fixes.length > 0) {
        suggestions.push({
          id: `fix-${category}-${Date.now()}`,
          category,
          fixes,
          priority: this.calculatePriority(categoryIssues),
          canAutoApply: fixes.every(fix => fix.automated && fix.confidence > 90),
          requiresReview: fixes.some(fix => fix.confidence < 95 || fix.estimatedImpact === 'high')
        })
      }
    })

    return suggestions.sort((a, b) => b.priority - a.priority)
  }

  // 获取特定类别的修复建议
  private static getFixesForCategory(category: string, issues: any[]): CodeFix[] {
    const availableFixes = this.COMMON_FIXES[category] || []
    const applicableFixes: CodeFix[] = []

    issues.forEach(issue => {
      const matchingFixes = availableFixes.filter(fix => 
        this.isFixApplicableToIssue(fix, issue)
      )
      applicableFixes.push(...matchingFixes)
    })

    return applicableFixes
  }

  // 判断修复是否适用于特定问题
  private static isFixApplicableToIssue(fix: CodeFix, issue: any): boolean {
    // 基于问题类型和标签匹配
    const issueKeywords = issue.title.toLowerCase() + ' ' + issue.description.toLowerCase()
    return fix.tags.some(tag => issueKeywords.includes(tag))
  }

  // 从问题中提取类别
  private static getCategoryFromIssue(issue: any): string {
    const category = issue.category?.toLowerCase() || ''
    
    if (category.includes('accessibility') || category.includes('无障碍')) return 'accessibility'
    if (category.includes('performance') || category.includes('性能')) return 'performance'
    if (category.includes('security') || category.includes('安全')) return 'security'
    if (category.includes('code') || category.includes('代码')) return 'code-quality'
    
    return 'general'
  }

  // 计算优先级
  private static calculatePriority(issues: any[]): number {
    const severityWeights = {
      'critical': 10,
      'high': 7,
      'medium': 4,
      'low': 1
    }

    return issues.reduce((sum, issue) => {
      return sum + (severityWeights[issue.severity as keyof typeof severityWeights] || 1)
    }, 0)
  }

  // 生成自定义修复建议
  static generateCustomFix(
    issue: any, 
    context: {
      filePath?: string,
      codeContext?: string,
      framework?: string
    }
  ): CodeFix | null {
    // 基于问题上下文生成定制化修复建议
    const { filePath, codeContext, framework } = context

    // 根据文件路径和框架推断最佳修复方案
    if (framework === 'next.js' && issue.category?.includes('performance')) {
      return this.generateNextJsPerformanceFix(issue, filePath)
    }

    if (issue.category?.includes('accessibility') && codeContext) {
      return this.generateAccessibilityFix(issue, codeContext)
    }

    return null
  }

  // 生成 Next.js 性能优化修复
  private static generateNextJsPerformanceFix(issue: any, filePath?: string): CodeFix {
    return {
      id: `nextjs-perf-${Date.now()}`,
      issueId: issue.id,
      type: 'code-replacement',
      title: 'Next.js 性能优化',
      description: '应用 Next.js 最佳实践来提升性能',
      afterCode: `// 使用 Next.js 优化技术
import dynamic from 'next/dynamic'
import { memo } from 'react'

// 动态导入组件
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
})

// 记忆化组件
const OptimizedComponent = memo(function Component({ data }) {
  return <div>{/* 组件内容 */}</div>
})`,
      filePath,
      automated: false,
      confidence: 85,
      estimatedImpact: 'medium',
      tags: ['nextjs', 'performance', 'optimization']
    }
  }

  // 生成无障碍访问修复
  private static generateAccessibilityFix(issue: any, codeContext: string): CodeFix {
    return {
      id: `a11y-${Date.now()}`,
      issueId: issue.id,
      type: 'code-replacement',
      title: '无障碍访问改进',
      description: '添加必要的 ARIA 属性和语义化标签',
      beforeCode: codeContext,
      afterCode: this.enhanceCodeForAccessibility(codeContext),
      automated: false,
      confidence: 90,
      estimatedImpact: 'high',
      tags: ['accessibility', 'aria', 'semantic']
    }
  }

  // 增强代码的无障碍访问性
  private static enhanceCodeForAccessibility(code: string): string {
    // 简单的代码增强示例
    let enhanced = code

    // 为按钮添加 aria-label
    enhanced = enhanced.replace(
      /<button([^>]*?)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
          return `<button${attrs} aria-label="执行操作">`
        }
        return match
      }
    )

    // 为输入框添加标签关联
    enhanced = enhanced.replace(
      /<input([^>]*?)type="([^"]*?)"([^>]*?)>/g,
      (match, beforeType, type, afterType) => {
        if (!beforeType.includes('aria-label') && !afterType.includes('aria-label')) {
          return `<input${beforeType}type="${type}"${afterType} aria-label="${type}输入框">`
        }
        return match
      }
    )

    return enhanced
  }

  // 应用自动修复
  static async applyAutoFixes(suggestions: AutoFixSuggestion[]): Promise<{
    applied: number,
    failed: number,
    results: Array<{ id: string, success: boolean, error?: string }>
  }> {
    const results: Array<{ id: string, success: boolean, error?: string }> = []
    let applied = 0
    let failed = 0

    for (const suggestion of suggestions) {
      if (suggestion.canAutoApply) {
        for (const fix of suggestion.fixes) {
          try {
            // 模拟应用修复（实际项目中这里会修改文件）
            console.log(`应用修复: ${fix.title}`)
            await new Promise(resolve => setTimeout(resolve, 500)) // 模拟处理时间
            
            results.push({ id: fix.id, success: true })
            applied++
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误'
            results.push({ id: fix.id, success: false, error: errorMessage })
            failed++
          }
        }
      }
    }

    return { applied, failed, results }
  }

  // 获取修复预览
  static getFixPreview(fix: CodeFix): {
    title: string,
    description: string,
    beforeCode?: string,
    afterCode?: string,
    impact: string
  } {
    return {
      title: fix.title,
      description: fix.description,
      beforeCode: fix.beforeCode,
      afterCode: fix.afterCode,
      impact: `预计影响: ${fix.estimatedImpact} (置信度: ${fix.confidence}%)`
    }
  }
}

export type { CodeFix, AutoFixSuggestion }