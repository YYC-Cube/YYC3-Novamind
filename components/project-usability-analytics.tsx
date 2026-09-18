'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditResult, GlobalAuditSystem } from '@/lib/global-audit-system'
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface AuditMetric {
  name: string
  value: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface QualityInsight {
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description: string
  actionable: boolean
  priority: 'high' | 'medium' | 'low'
}

export default function ProjectUsabilityAnalytics() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<AuditMetric[]>([])
  const [insights, setInsights] = useState<QualityInsight[]>([])
  const [, setIsAnalyzing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    GlobalAuditSystem.initialize()
    loadAnalyticsData()
  }, [selectedTimeRange])

  const loadAnalyticsData = async () => {
    setIsAnalyzing(true)

    try {
      // 加载审核结果
      const results = GlobalAuditSystem.getProjectAudits('智能交互AI')
      setAuditResults(results)

      // 生成指标数据
      const metrics = generateMetrics(results)
      setCurrentMetrics(metrics)

      // 生成洞察
      const generatedInsights = generateInsights(results)
      setInsights(generatedInsights)
    } catch (error) {
      console.error('加载分析数据失败:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getDimensionScore = (
    result: AuditResult,
    dimensionId: string
  ): number =>
    result.dimensionResults.find(d => d.dimensionId === dimensionId)?.score || 0

  const generateMetrics = (results: AuditResult[]): AuditMetric[] => {
    if (results.length === 0) {
      return []
    }

    const latest = results[0]!
    const previous = results.length > 1 ? results[1] : undefined
    const prevScore = (id: string) => (previous ? getDimensionScore(previous, id) : 0)

    const metrics: AuditMetric[] = [
      {
        name: '整体质量分数',
        value: latest.overallScore,
        status: getStatus(latest.overallScore),
        trend: getTrend(latest.overallScore, previous?.overallScore ?? latest.overallScore),
        description: '项目综合质量评分'
      },
      {
        name: '代码质量',
        value: getDimensionScore(latest, 'code-quality'),
        status: getStatus(getDimensionScore(latest, 'code-quality')),
        trend: getTrend(getDimensionScore(latest, 'code-quality'), prevScore('code-quality')),
        description: '代码结构和质量评估'
      },
      {
        name: '功能完善度',
        value: getDimensionScore(latest, 'functionality'),
        status: getStatus(getDimensionScore(latest, 'functionality')),
        trend: getTrend(getDimensionScore(latest, 'functionality'), prevScore('functionality')),
        description: '功能实现和业务逻辑'
      },
      {
        name: '性能表现',
        value: getDimensionScore(latest, 'performance'),
        status: getStatus(getDimensionScore(latest, 'performance')),
        trend: getTrend(getDimensionScore(latest, 'performance'), prevScore('performance')),
        description: '加载速度和运行效率'
      },
      {
        name: '可用性',
        value: getDimensionScore(latest, 'usability'),
        status: getStatus(getDimensionScore(latest, 'usability')),
        trend: getTrend(getDimensionScore(latest, 'usability'), prevScore('usability')),
        description: '用户体验和界面设计'
      },
      {
        name: '安全性',
        value: getDimensionScore(latest, 'security'),
        status: getStatus(getDimensionScore(latest, 'security')),
        trend: getTrend(getDimensionScore(latest, 'security'), prevScore('security')),
        description: '数据安全和漏洞防护'
      }
    ]

    return metrics
  }

  const generateInsights = (results: AuditResult[]): QualityInsight[] => {
    const insights: QualityInsight[] = []

    if (results.length === 0) return insights

    const latest = results[0]!

    // 基于整体分数的洞察
    if (latest.overallScore >= 90) {
      insights.push({
        type: 'success',
        title: '项目质量优秀',
        description: `当前项目整体质量分数为 ${latest.overallScore}，达到优秀水平`,
        actionable: false,
        priority: 'low'
      })
    } else if (latest.overallScore < 70) {
      insights.push({
        type: 'danger',
        title: '项目质量需要重大改进',
        description: `整体质量分数仅为 ${latest.overallScore}，需要立即关注和改进`,
        actionable: true,
        priority: 'high'
      })
    }

    // 基于维度分析的洞察
    const lowScoreDimensions = latest.dimensionResults.filter(d => d.score < 75)
    if (lowScoreDimensions.length > 0) {
      insights.push({
        type: 'warning',
        title: `${lowScoreDimensions.length} 个维度需要改进`,
        description: `发现以下维度得分偏低: ${lowScoreDimensions.map(d => getDimensionName(d.dimensionId)).join(', ')}`,
        actionable: true,
        priority: 'high'
      })
    }

    // 基于问题数量的洞察
    const criticalIssues = latest.dimensionResults
      .flatMap(d => d.issues)
      .filter(issue => issue.severity === 'critical')

    if (criticalIssues.length > 0) {
      insights.push({
        type: 'danger',
        title: `发现 ${criticalIssues.length} 个严重问题`,
        description: '存在严重问题需要立即处理，可能影响项目正常运行',
        actionable: true,
        priority: 'high'
      })
    }

    // 基于趋势的洞察
    if (results.length >= 2) {
      const previousScore = results[1]!.overallScore
      const improvement = latest.overallScore - previousScore

      if (improvement > 5) {
        insights.push({
          type: 'success',
          title: '质量显著提升',
          description: `相比上次审核，整体质量提升了 ${improvement.toFixed(1)} 分`,
          actionable: false,
          priority: 'low'
        })
      } else if (improvement < -5) {
        insights.push({
          type: 'warning',
          title: '质量有所下降',
          description: `相比上次审核，整体质量下降了 ${Math.abs(improvement).toFixed(1)} 分`,
          actionable: true,
          priority: 'medium'
        })
      }
    }

    // 基于修复时间的洞察
    if (latest.estimatedCompletionTime > 100) {
      insights.push({
        type: 'info',
        title: '修复时间较长',
        description: `预计需要 ${latest.estimatedCompletionTime} 小时来修复所有问题，建议制定详细计划`,
        actionable: true,
        priority: 'medium'
      })
    }

    return insights
  }

  const getStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'poor'
  }

  const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const diff = current - previous
    if (Math.abs(diff) < 2) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  const getDimensionName = (dimensionId: string): string => {
    const names: Record<string, string> = {
      'code-quality': '代码质量',
      'functionality': '功能完善度',
      'performance': '性能表现',
      'usability': '可用性',
      'security': '安全性'
    }
    return names[dimensionId] || dimensionId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />
    }
  }

  // 生成图表数据
  const chartData = auditResults.slice(0, 10).reverse().map(result => ({
    date: result.auditDate.toLocaleDateString(),
    overall: result.overallScore,
    codeQuality: result.dimensionResults.find(d => d.dimensionId === 'code-quality')?.score || 0,
    functionality: result.dimensionResults.find(d => d.dimensionId === 'functionality')?.score || 0,
    performance: result.dimensionResults.find(d => d.dimensionId === 'performance')?.score || 0,
    usability: result.dimensionResults.find(d => d.dimensionId === 'usability')?.score || 0,
    security: result.dimensionResults.find(d => d.dimensionId === 'security')?.score || 0
  }))

  const pieData = currentMetrics.slice(1).map((metric) => ({
    name: metric.name,
    value: metric.value
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">项目功能完善可用度分析</h1>
          <p className="text-gray-600 mt-2">深度分析项目质量和可用性指标</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange('7d')}
          >
            7天
          </Button>
          <Button
            variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange('30d')}
          >
            30天
          </Button>
          <Button
            variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange('90d')}
          >
            90天
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </div>
                <Badge variant={
                  metric.status === 'excellent' ? 'default' :
                    metric.status === 'good' ? 'secondary' :
                      metric.status === 'fair' ? 'outline' : 'destructive'
                }>
                  {metric.status}
                </Badge>
              </div>
              <Progress value={metric.value} className="mt-3 h-2" />
              <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 洞察和建议 */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              智能洞察
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <Alert key={index} className={
                  insight.type === 'success' ? 'border-green-200 bg-green-50' :
                    insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      insight.type === 'danger' ? 'border-red-200 bg-red-50' :
                        'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className={`h-4 w-4 ${insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                      insight.type === 'danger' ? 'text-red-600' :
                        'text-blue-600'
                    }`} />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium mb-1">{insight.title}</div>
                        <div className="text-sm">{insight.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.priority}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="secondary" className="text-xs">
                            可执行
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="distribution">分布分析</TabsTrigger>
          <TabsTrigger value="comparison">维度对比</TabsTrigger>
          <TabsTrigger value="details">详细指标</TabsTrigger>
        </TabsList>

        {/* 趋势分析 */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>质量分数趋势</CardTitle>
              <p className="text-gray-600">查看项目质量指标随时间的变化趋势</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="overall"
                      stroke="#8884d8"
                      strokeWidth={3}
                      name="整体分数"
                    />
                    <Line
                      type="monotone"
                      dataKey="codeQuality"
                      stroke="#82ca9d"
                      name="代码质量"
                    />
                    <Line
                      type="monotone"
                      dataKey="functionality"
                      stroke="#ffc658"
                      name="功能完善度"
                    />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#ff7300"
                      name="性能表现"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分布分析 */}
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>维度分数分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>维度得分对比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pieData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 维度对比 */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>多维度对比分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="codeQuality"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="代码质量"
                    />
                    <Area
                      type="monotone"
                      dataKey="functionality"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="功能完善度"
                    />
                    <Area
                      type="monotone"
                      dataKey="performance"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.6}
                      name="性能表现"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 详细指标 */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>当前状态指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-gray-600">{metric.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                          {metric.value}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className="text-xs text-gray-500">{metric.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>改进目标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMetrics
                    .filter(m => m.status !== 'excellent')
                    .map((metric, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{metric.name}</span>
                          <Badge variant="outline">
                            目标: 90+
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>当前: {metric.value}</span>
                            <span>差距: {90 - metric.value}</span>
                          </div>
                          <Progress value={metric.value} className="h-2" />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {metric.status === 'poor' && '需要立即改进'}
                          {metric.status === 'fair' && '需要持续优化'}
                          {metric.status === 'good' && '接近目标，继续努力'}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
