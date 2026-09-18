'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Eye,
  Play,
  Settings,
  ArrowRight
} from 'lucide-react'
import ProjectUsabilityAnalytics from '@/components/project-usability-analytics'
import { GlobalAuditSystem } from '@/lib/global-audit-system'

export default function GlobalAuditHomePage() {
  const [systemInitialized, setSystemInitialized] = useState(false)
  const [quickStats, setQuickStats] = useState<any>(null)
  const [lastAudit, setLastAudit] = useState<any>(null)

  useEffect(() => {
    // 初始化系统
    GlobalAuditSystem.initialize()
    setSystemInitialized(true)
    
    // 加载快速统计
    loadQuickStats()
  }, [])

  const loadQuickStats = () => {
    const stats = GlobalAuditSystem.getAuditStats()
    const projectAudits = GlobalAuditSystem.getProjectAudits('智能交互AI')
    
    setQuickStats(stats)
    if (projectAudits.length > 0) {
      setLastAudit(projectAudits[0])
    }
  }

  const startQuickAudit = async () => {
    try {
      await GlobalAuditSystem.startComprehensiveAudit('智能交互AI', 'admin', {
        automated: true
      })
      loadQuickStats()
    } catch (error) {
      console.error('快速审核失败:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadgeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'default'
    if (grade.startsWith('B')) return 'secondary'
    if (grade.startsWith('C')) return 'outline'
    return 'destructive'
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 系统状态提示 */}
      {!systemInitialized && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            正在初始化全局多维度审核系统...
          </AlertDescription>
        </Alert>
      )}

      {/* 欢迎区域 */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <BarChart3 className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            全局多维度审核系统
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            智能评估项目功能完善可用度，提供专业优化建议
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/global-audit">
              <Button size="lg" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                开始全面审核
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              查看历史记录
            </Button>
          </div>
        </div>
      </div>

      {/* 快速概览 */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">审核总数</p>
                  <p className="text-3xl font-bold text-blue-600">{quickStats.totalAudits}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-500 opacity-75" />
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>持续监控中</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均得分</p>
                  <p className={`text-3xl font-bold ${getScoreColor(quickStats.averageScore)}`}>
                    {quickStats.averageScore}
                  </p>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={quickStats.averageScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已完成</p>
                  <p className="text-3xl font-bold text-green-600">{quickStats.completedAudits}</p>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                <span>✓ 审核完成</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">待处理问题</p>
                  <p className="text-3xl font-bold text-red-600">{quickStats.pendingIssues}</p>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-red-600">
                <span>需要关注</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 最近审核结果 */}
      {lastAudit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              最近审核结果
              <Badge variant={getGradeBadgeVariant(lastAudit.overallGrade)}>
                {lastAudit.overallGrade}
              </Badge>
            </CardTitle>
            <p className="text-gray-600">
              审核时间: {new Date(lastAudit.auditDate).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">整体质量分数</span>
                  <span className={`text-3xl font-bold ${getScoreColor(lastAudit.overallScore)}`}>
                    {lastAudit.overallScore}
                  </span>
                </div>
                <Progress value={lastAudit.overallScore} className="h-3 mb-4" />
                
                <div className="space-y-3">
                  {lastAudit.dimensionResults.map((dimension: any) => (
                    <div key={dimension.dimensionId} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {dimension.dimensionId === 'code-quality' && '代码质量'}
                        {dimension.dimensionId === 'functionality' && '功能完善度'}
                        {dimension.dimensionId === 'performance' && '性能表现'}
                        {dimension.dimensionId === 'usability' && '可用性'}
                        {dimension.dimensionId === 'security' && '安全性'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress value={dimension.score} className="w-20 h-2" />
                        <span className={`font-medium ${getScoreColor(dimension.score)}`}>
                          {dimension.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4">关键问题</h4>
                <div className="space-y-3">
                  {lastAudit.dimensionResults
                    .flatMap((d: any) => d.issues)
                    .filter((issue: any) => issue.severity === 'critical' || issue.severity === 'high')
                    .slice(0, 5)
                    .map((issue: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-red-800">{issue.title}</p>
                          <p className="text-xs text-red-600">{issue.category}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Link href="/global-audit">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      查看详情
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button onClick={startQuickAudit} size="sm">
                    重新审核
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 功能特性介绍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>多维度评估</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              从代码质量、功能完善度、性能、可用性、安全性等多个维度全面评估项目
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 自动化代码分析</li>
              <li>• 功能完整性检查</li>
              <li>• 性能指标监测</li>
              <li>• 用户体验评估</li>
              <li>• 安全漏洞扫描</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>智能建议</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              基于审核结果生成专业的优化建议和具体的行动计划
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 问题优先级排序</li>
              <li>• 修复时间估算</li>
              <li>• 具体改进方案</li>
              <li>• 最佳实践建议</li>
              <li>• 进度跟踪支持</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle>持续监控</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              定期审核和趋势分析，帮助项目持续改进和质量提升
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 定期自动审核</li>
              <li>• 质量趋势分析</li>
              <li>• 历史对比报告</li>
              <li>• 改进效果跟踪</li>
              <li>• 团队协作支持</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作按钮 */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <Link href="/global-audit">
            <Button variant="default" size="lg" className="w-full flex items-center gap-2">
              <Play className="w-5 h-5" />
              开始全面审核
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full flex items-center gap-2"
            onClick={startQuickAudit}
          >
            <TrendingUp className="w-5 h-5" />
            快速评估
          </Button>
          <Button variant="ghost" size="lg" className="w-full flex items-center gap-2">
            <Settings className="w-5 h-5" />
            系统设置
          </Button>
        </div>
      </div>

      {/* 嵌入分析组件 */}
      {quickStats && quickStats.totalAudits > 0 && (
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">项目质量分析</h2>
            <p className="text-gray-600">深度分析项目各项指标和改进趋势</p>
          </div>
          <ProjectUsabilityAnalytics />
        </div>
      )}
    </div>
  )
}