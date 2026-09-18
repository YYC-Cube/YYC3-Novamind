'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Bug,
  CheckCircle2,
  Gauge,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis
} from 'recharts'

interface AnalyticsData {
  timeSeriesData: Array<{
    date: string
    codeQuality: number
    performance: number
    security: number
    usability: number
    bugs: number
    commits: number
  }>
  dimensionComparison: Array<{
    dimension: string
    current: number
    previous: number
    target: number
  }>
  fixImpactAnalysis: Array<{
    category: string
    impact: number
    count: number
    trend: 'up' | 'down' | 'stable'
  }>
  teamPerformance: Array<{
    member: string
    contributions: number
    quality: number
    fixes: number
  }>
  codeComplexity: Array<{
    file: string
    complexity: number
    size: number
    maintainability: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function AdvancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟获取分析数据
    const generateAnalyticsData = (): AnalyticsData => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0] ?? ''
      }).reverse()

      return {
        timeSeriesData: dates.map(date => ({
          date,
          codeQuality: Math.floor(Math.random() * 20) + 75,
          performance: Math.floor(Math.random() * 25) + 70,
          security: Math.floor(Math.random() * 15) + 80,
          usability: Math.floor(Math.random() * 30) + 65,
          bugs: Math.floor(Math.random() * 10) + 2,
          commits: Math.floor(Math.random() * 8) + 3
        })),
        dimensionComparison: [
          { dimension: '代码质量', current: 85, previous: 78, target: 90 },
          { dimension: '功能完整性', current: 92, previous: 88, target: 95 },
          { dimension: '性能表现', current: 76, previous: 72, target: 85 },
          { dimension: '用户体验', current: 81, previous: 83, target: 88 },
          { dimension: '安全性', current: 88, previous: 85, target: 92 }
        ],
        fixImpactAnalysis: [
          { category: '可访问性', impact: 15, count: 8, trend: 'up' },
          { category: '性能优化', impact: 25, count: 12, trend: 'up' },
          { category: '安全漏洞', impact: 35, count: 5, trend: 'down' },
          { category: '代码质量', impact: 20, count: 15, trend: 'stable' }
        ],
        teamPerformance: [
          { member: '开发者A', contributions: 45, quality: 88, fixes: 12 },
          { member: '开发者B', contributions: 38, quality: 92, fixes: 8 },
          { member: '开发者C', contributions: 52, quality: 85, fixes: 15 },
          { member: '开发者D', contributions: 29, quality: 90, fixes: 6 }
        ],
        codeComplexity: [
          { file: 'auth-service.ts', complexity: 8.5, size: 450, maintainability: 72 },
          { file: 'api-handler.ts', complexity: 12.3, size: 680, maintainability: 65 },
          { file: 'user-interface.tsx', complexity: 6.2, size: 320, maintainability: 85 },
          { file: 'data-processor.ts', complexity: 15.1, size: 890, maintainability: 58 }
        ]
      }
    }

    setTimeout(() => {
      setAnalyticsData(generateAnalyticsData())
      setIsLoading(false)
    }, 1500)
  }, [selectedTimeRange])

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestData = analyticsData.timeSeriesData[analyticsData.timeSeriesData.length - 1]
  if (!latestData) return null

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">高级分析仪表板</h2>
          <p className="text-gray-600">深度洞察项目健康状况和改进趋势</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7天' },
            { value: '30d', label: '30天' },
            { value: '90d', label: '90天' }
          ].map((range) => (
            <Button
              key={range.value}
              variant={selectedTimeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">整体健康度</p>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((latestData.codeQuality + latestData.performance + latestData.security + latestData.usability) / 4)}%
                </div>
              </div>
              <Gauge className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+3.2% 较上周</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">智能修复</p>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.fixImpactAnalysis.reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">自动应用 85%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待解决问题</p>
                <div className="text-2xl font-bold text-gray-900">{latestData.bugs}</div>
              </div>
              <Bug className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">-2 较昨日</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">团队活跃度</p>
                <div className="text-2xl font-bold text-gray-900">{latestData.commits}</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">提交/天</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表分析区域 */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="dimensions">维度对比</TabsTrigger>
          <TabsTrigger value="fixes">修复影响</TabsTrigger>
          <TabsTrigger value="team">团队表现</TabsTrigger>
          <TabsTrigger value="complexity">代码复杂度</TabsTrigger>
        </TabsList>

        {/* 趋势分析 */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>项目健康度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="codeQuality" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="performance" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="security" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="usability" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 维度对比 */}
        <TabsContent value="dimensions">
          <Card>
            <CardHeader>
              <CardTitle>多维度对比分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={analyticsData.dimensionComparison}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="当前" dataKey="current" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Radar name="上期" dataKey="previous" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Radar name="目标" dataKey="target" stroke="#F59E0B" fill="none" strokeDasharray="5 5" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 修复影响分析 */}
        <TabsContent value="fixes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>修复影响分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.fixImpactAnalysis}
                        dataKey="impact"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {analyticsData.fixImpactAnalysis.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>修复趋势详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.fixImpactAnalysis.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{item.count} 个</Badge>
                        <div className="flex items-center gap-1">
                          {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                          {item.trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                          <span className="text-sm text-gray-600">{item.impact}% 影响</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 团队表现 */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>团队成员贡献分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="member" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="contributions" fill="#3B82F6" name="贡献度" />
                    <Bar dataKey="quality" fill="#10B981" name="质量分" />
                    <Bar dataKey="fixes" fill="#F59E0B" name="修复数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 代码复杂度 */}
        <TabsContent value="complexity">
          <Card>
            <CardHeader>
              <CardTitle>代码复杂度热力图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={analyticsData.codeComplexity}
                    dataKey="complexity"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#3B82F6"
                  />
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.codeComplexity.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm mb-2">{item.file}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>复杂度:</span>
                        <Badge variant={item.complexity > 10 ? "destructive" : "secondary"}>
                          {item.complexity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>大小:</span>
                        <span>{item.size} 行</span>
                      </div>
                      <div className="flex justify-between">
                        <span>可维护性:</span>
                        <span>{item.maintainability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
