'use client'

import { AdvancedAnalyticsDashboard } from '@/components/advanced-analytics-dashboard'
import IntelligentFixPanel from "@/components/intelligent-fix-panel"
import { OneClickOptimization } from '@/components/one-click-optimization'
import { RealTimeCollaboration } from '@/components/realtime-collaboration'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAuditProgress,
  useAuditStatusMonitor,
  usePerformanceMetrics
} from '@/hooks/use-audit-hooks'
import { AuditResult, GlobalAuditSystem } from '@/lib/global-audit-system'
import {
  Activity,
  AlertTriangle,
  BarChart,
  BarChart3,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function GlobalAuditDashboard() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([])
  const [currentAudit, setCurrentAudit] = useState<AuditResult | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditStats, setAuditStats] = useState<any>(null)
  const [selectedProjectId, _setSelectedProjectId] = useState<string>('智能交互AI')

  // 使用自定义 hooks
  const { progress, currentStep, isRunning, estimatedTimeLeft, startProgress } = useAuditProgress()
  const systemStatus = useAuditStatusMonitor()
  const performanceMetrics = usePerformanceMetrics()

  useEffect(() => {
    // 初始化审核系统
    GlobalAuditSystem.initialize()
    loadAuditData()
  }, [])

  const loadAuditData = () => {
    const stats = GlobalAuditSystem.getAuditStats()
    const projectAudits = GlobalAuditSystem.getProjectAudits(selectedProjectId)

    setAuditStats(stats)
    setAuditResults(projectAudits)

    if (projectAudits.length > 0) {
      setCurrentAudit(projectAudits[0] ?? null)
    }
  }

  const startNewAudit = async () => {
    setIsAuditing(true)
    const cleanup = startProgress(6) // 6个步骤的进度跟踪

    try {
      const result = await GlobalAuditSystem.startComprehensiveAudit(
        selectedProjectId,
        'admin',
        {
          automated: true,
          generateReport: true
        }
      )

      setCurrentAudit(result)
      loadAuditData()

      // 显示成功消息
      setTimeout(() => {
        setIsAuditing(false)
      }, 1000)

    } catch (error) {
      console.error('审核失败:', error)
      setIsAuditing(false)
    } finally {
      cleanup && cleanup()
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 头部标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">全局多维度审核系统</h1>
          <p className="text-gray-600 mt-2">项目功能完善可用度评估与优化建议</p>

          {/* 实时状态指示器 */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus.isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-gray-600">
                系统{systemStatus.isHealthy ? '正常' : '异常'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              负载: {Math.round(systemStatus.systemLoad)}%
            </div>
            <div className="text-sm text-gray-600">
              最后检查: {systemStatus.lastCheck.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={startNewAudit}
            disabled={isAuditing || isRunning}
            className="flex items-center gap-2"
          >
            {isAuditing || isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isAuditing || isRunning ? '审核中...' : '开始审核'}
          </Button>
          <Button variant="outline" onClick={loadAuditData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 审核进度显示 */}
      {(isAuditing || isRunning) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-800">审核进度</span>
                <span className="text-sm text-blue-600">
                  预计剩余时间: {Math.ceil(estimatedTimeLeft / 60)} 分钟
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-blue-700">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm">{currentStep}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 实时性能指标 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(performanceMetrics.memoryUsage)}%</div>
              <div className="text-xs text-blue-700">内存使用</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(performanceMetrics.cpuUsage)}%</div>
              <div className="text-xs text-green-700">CPU 使用</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.activeConnections}</div>
              <div className="text-xs text-purple-700">活跃连接</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(performanceMetrics.responseTime)}ms</div>
              <div className="text-xs text-orange-700">响应时间</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{performanceMetrics.errorRate.toFixed(1)}%</div>
              <div className="text-xs text-red-700">错误率</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总审核次数</p>
                  <p className="text-2xl font-bold">{auditStats.totalAudits}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(auditStats.averageScore)}`}>
                    {auditStats.averageScore}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成审核</p>
                  <p className="text-2xl font-bold text-green-600">{auditStats.completedAudits}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待处理问题</p>
                  <p className="text-2xl font-bold text-red-600">{auditStats.pendingIssues}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容区域 */}
      {currentAudit ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="dimensions">维度详情</TabsTrigger>
            <TabsTrigger value="issues">问题列表</TabsTrigger>
            <TabsTrigger value="recommendations">优化建议</TabsTrigger>
            <TabsTrigger value="one-click" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <Zap className="w-4 h-4 mr-1" />
              一键优化
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="w-4 h-4 mr-1" />
              深度分析
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              <Users className="w-4 h-4 mr-1" />
              团队协作
            </TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          {/* 总览标签页 */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      审核总览
                      <Badge variant={getGradeBadgeVariant(currentAudit.overallGrade)}>
                        {currentAudit.overallGrade}
                      </Badge>
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      项目ID: {currentAudit.projectId} |
                      审核时间: {currentAudit.auditDate.toLocaleDateString()} |
                      预计修复时间: {currentAudit.estimatedCompletionTime} 小时
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(currentAudit.overallScore)}`}>
                      {currentAudit.overallScore}
                    </div>
                    <p className="text-sm text-gray-600">综合得分</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={currentAudit.overallScore} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {currentAudit.dimensionResults.map((dimension) => (
                    <div key={dimension.dimensionId} className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                        {dimension.score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {dimension.dimensionId === 'code-quality' && '代码质量'}
                        {dimension.dimensionId === 'functionality' && '功能完善度'}
                        {dimension.dimensionId === 'performance' && '性能表现'}
                        {dimension.dimensionId === 'usability' && '可用性'}
                        {dimension.dimensionId === 'security' && '安全性'}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {dimension.grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速问题概览 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">关键问题</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentAudit.dimensionResults
                      .flatMap(d => d.issues)
                      .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
                      .slice(0, 5)
                      .map((issue, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 border rounded">
                          <AlertTriangle className={`w-4 h-4 mt-1 ${getSeverityColor(issue.severity)}`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{issue.title}</p>
                            <p className="text-xs text-gray-600">{issue.category}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {issue.severity}
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">优先建议</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentAudit.recommendations
                      .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
                      .slice(0, 5)
                      .map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 border rounded">
                          <TrendingUp className="w-4 h-4 mt-1 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{rec.title}</p>
                            <p className="text-xs text-gray-600">{rec.type}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {rec.priority}
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 维度详情标签页 */}
          <TabsContent value="dimensions" className="space-y-4">
            <div className="grid gap-4">
              {currentAudit.dimensionResults.map((dimension) => (
                <Card key={dimension.dimensionId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-3">
                        {dimension.dimensionId === 'code-quality' && '代码质量'}
                        {dimension.dimensionId === 'functionality' && '功能完善度'}
                        {dimension.dimensionId === 'performance' && '性能表现'}
                        {dimension.dimensionId === 'usability' && '可用性'}
                        {dimension.dimensionId === 'security' && '安全性'}
                        <Badge variant={getGradeBadgeVariant(dimension.grade)}>
                          {dimension.grade}
                        </Badge>
                      </CardTitle>
                      <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                        {dimension.score}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={dimension.score} className="mb-4 h-2" />

                    {/* 标准评估结果 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">评估标准</h4>
                      {dimension.criteriasResults.map((criteria, index) => (
                        <div key={index} className="p-3 border rounded">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{criteria.criteriaId}</span>
                            <span className={`font-bold ${getScoreColor(criteria.score)}`}>
                              {criteria.score}
                            </span>
                          </div>
                          {criteria.evidence.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <p>证据：{criteria.evidence.join(', ')}</p>
                            </div>
                          )}
                          {criteria.issues.length > 0 && (
                            <div className="mt-2">
                              {criteria.issues.map((issue, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                                  <XCircle className="w-3 h-3" />
                                  {issue}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 建议 */}
                    {dimension.suggestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">改进建议</h4>
                        <div className="space-y-1">
                          {dimension.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <TrendingUp className="w-3 h-3 mt-1 text-blue-500" />
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 问题列表标签页 */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>发现的问题</CardTitle>
                <p className="text-gray-600">
                  共发现 {currentAudit.dimensionResults.flatMap(d => d.issues).length} 个问题
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {currentAudit.dimensionResults
                      .flatMap(d => d.issues)
                      .sort((a, b) => b.priority - a.priority)
                      .map((issue, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${getSeverityColor(issue.severity)}`} />
                              <span className="font-medium">{issue.title}</span>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {issue.severity}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {issue.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              预计修复: {Math.round(issue.estimatedFixTime / 60)}小时
                            </span>
                            <span>优先级: {issue.priority}</span>
                            {issue.location && <span>位置: {issue.location}</span>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 优化建议标签页 */}
          <TabsContent value="recommendations" className="space-y-4">
            <Tabs defaultValue="suggestions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="suggestions">手动建议</TabsTrigger>
                <TabsTrigger value="intelligent-fixes">
                  <Zap className="w-4 h-4 mr-1" />
                  智能修复
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions">
                <div className="space-y-4">
                  {currentAudit.recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="flex items-center gap-3">
                            {rec.title}
                            <Badge variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">
                              {rec.type}
                            </Badge>
                          </CardTitle>
                          <div className="text-right text-sm text-gray-600">
                            影响: {rec.estimatedImpact} | 工作量: {rec.estimatedEffort}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{rec.description}</p>

                        <h4 className="font-medium mb-2">行动项目</h4>
                        <div className="space-y-2">
                          {rec.actionItems.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span>{action.task}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {action.estimatedHours}h
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {action.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="intelligent-fixes">
                <IntelligentFixPanel
                  issues={currentAudit.dimensionResults.flatMap(d => d.issues)}
                  onApplyFix={(fixId: string) => {
                    console.log('应用修复:', fixId)
                    // 这里可以实际应用修复
                  }}
                  onPreviewFix={(fix: unknown) => {
                    console.log('预览修复:', fix)
                  }}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 一键优化标签页 */}
          <TabsContent value="one-click" className="space-y-4">
            <OneClickOptimization
              issues={currentAudit.dimensionResults.flatMap(d => d.issues)}
              onOptimizationComplete={(results) => {
                console.log('优化完成:', results)
                // 可以在这里更新审核结果或刷新数据
                startNewAudit()
              }}
            />
          </TabsContent>

          {/* 深度分析标签页 */}
          <TabsContent value="analytics" className="space-y-4">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          {/* 团队协作标签页 */}
          <TabsContent value="collaboration" className="space-y-4">
            <RealTimeCollaboration />
          </TabsContent>

          {/* 历史记录标签页 */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>审核历史</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditResults.map((audit) => (
                    <div
                      key={audit.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors
                        ${audit.id === currentAudit.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                      `}
                      onClick={() => setCurrentAudit(audit)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {audit.auditDate.toLocaleDateString()}
                            </span>
                            <Badge variant={getGradeBadgeVariant(audit.overallGrade)}>
                              {audit.overallGrade}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {audit.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {audit.dimensionResults.flatMap(d => d.issues).length} 个问题 |
                            {audit.recommendations.length} 条建议
                          </p>
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                          {audit.overallScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">暂无审核数据</h3>
            <p className="text-gray-600 mb-6">开始第一次审核来评估项目质量</p>
            <Button onClick={startNewAudit} disabled={isAuditing}>
              {isAuditing ? '审核中...' : '开始审核'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
