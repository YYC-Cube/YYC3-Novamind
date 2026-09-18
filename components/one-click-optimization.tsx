'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { OneClickOptimizer, OptimizationPlan, OptimizationResult } from '@/lib/one-click-optimizer'
import {
  Accessibility,
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  Play,
  RefreshCw,
  Rocket,
  Shield,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface OneClickOptimizationProps {
  issues: any[]
  onOptimizationComplete?: (results: OptimizationResult[]) => void
}

export function OneClickOptimization({ issues, onOptimizationComplete }: OneClickOptimizationProps) {
  const [optimizer] = useState(() => new OneClickOptimizer())
  const [plans, setPlans] = useState<OptimizationPlan[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([])
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<OptimizationPlan | null>(null)
  const [previewData, setPreviewData] = useState<{
    expectedImprovements: Array<{ metric: string; improvement: string }>
    risks: string[]
    recommendations: string[]
  } | null>(null)

  useEffect(() => {
    if (issues.length > 0) {
      generatePlans()
    }
  }, [issues])

  const generatePlans = async () => {
    setIsGenerating(true)
    try {
      const generatedPlans = await optimizer.generateOptimizationPlan(issues)
      setPlans(generatedPlans)
    } catch (error) {
      console.error('生成优化计划失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOptimizeAll = async () => {
    setIsOptimizing(true)
    setProgress(0)
    setCurrentStep('准备优化...')

    try {
      const results: OptimizationResult[] = []

      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i]
        if (!plan) continue
        setCurrentStep(`正在优化: ${plan.title}`)
        setProgress(((i + 1) / plans.length) * 100)

        const result = await optimizer.applyOptimizationPlan(plan)
        results.push(result)

        // 实时更新结果
        setOptimizationResults([...results])
      }

      setCurrentStep('优化完成!')
      onOptimizationComplete?.(results)
    } catch (error) {
      console.error('优化过程失败:', error)
      setCurrentStep('优化失败')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleOptimizeSingle = async (plan: OptimizationPlan) => {
    setIsOptimizing(true)
    setCurrentStep(`正在优化: ${plan.title}`)

    try {
      const result = await optimizer.applyOptimizationPlan(plan)
      setOptimizationResults(prev => [...prev, result])
      onOptimizationComplete?.([result])
    } catch (error) {
      console.error('单个优化失败:', error)
    } finally {
      setIsOptimizing(false)
      setCurrentStep('')
    }
  }

  const handlePreviewPlan = async (plan: OptimizationPlan) => {
    setSelectedPlan(plan)
    try {
      const preview = await optimizer.previewOptimization(plan)
      setPreviewData(preview)
    } catch (error) {
      console.error('预览失败:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Rocket className="w-5 h-5 text-blue-500" />
      case 'accessibility': return <Accessibility className="w-5 h-5 text-green-500" />
      case 'security': return <Shield className="w-5 h-5 text-red-500" />
      case 'code-quality': return <Code className="w-5 h-5 text-purple-500" />
      default: return <Zap className="w-5 h-5 text-yellow-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-y-4 flex-col">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-center">
              <h3 className="text-lg font-medium">正在分析项目问题...</h3>
              <p className="text-gray-600">AI 正在为您生成最佳优化方案</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总览和一键优化 */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="w-6 h-6 text-yellow-500" />
                一键智能优化
              </CardTitle>
              <p className="text-gray-600 mt-1">
                发现 {issues.length} 个问题，生成 {plans.length} 个优化方案
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleOptimizeAll}
                disabled={isOptimizing || plans.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Play className="w-4 h-4 mr-2" />
                全部优化
              </Button>
            </div>
          </div>
        </CardHeader>

        {isOptimizing && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{currentStep}</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* 优化计划列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(plan.category)}
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  </div>
                </div>
                <Badge variant={getPriorityColor(plan.priority) as any}>
                  {plan.priority === 'high' ? '高优先级' :
                    plan.priority === 'medium' ? '中优先级' : '低优先级'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{plan.fixes.length}</div>
                  <div className="text-xs text-gray-500">修复项目</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{plan.estimatedTime}m</div>
                  <div className="text-xs text-gray-500">预计时间</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {plan.autoApplicable ? '100%' : '80%'}
                  </div>
                  <div className="text-xs text-gray-500">自动化率</div>
                </div>
              </div>

              {plan.autoApplicable && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    此计划可完全自动执行，无需手动干预
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreviewPlan(plan)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      预览
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getCategoryIcon(plan.category)}
                        优化预览: {plan.title}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                      <div className="space-y-4">
                        {previewData && selectedPlan?.id === plan.id && (
                          <>
                            <div>
                              <h4 className="font-medium mb-2">预期改进效果</h4>
                              <div className="space-y-2">
                                {previewData.expectedImprovements.map((improvement: { metric: string; improvement: string }, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
                                    <span className="text-sm">{improvement.metric}</span>
                                    <Badge variant="secondary">{improvement.improvement}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {previewData.risks.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">风险提示</h4>
                                <div className="space-y-2">
                                  {previewData.risks.map((risk, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                      <span className="text-sm">{risk}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium mb-2">修复清单</h4>
                              <div className="space-y-2">
                                {plan.fixes.map((fix, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm flex-1">{fix.fixes[0]?.title ?? fix.id}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(fix.fixes[0]?.confidence ?? 0)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOptimizeSingle(plan)}
                  disabled={isOptimizing}
                >
                  <Target className="w-4 h-4 mr-1" />
                  立即优化
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 优化结果 */}
      {optimizationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              优化结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationResults.map((result, index) => {
                const plan = plans.find(p => p.id === result.planId)
                if (!plan) return null

                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(plan.category)}
                        <span className="font-medium">{plan.title}</span>
                      </div>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? '成功' : '失败'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">应用修复:</span>
                        <div className="font-medium">{result.appliedFixes.length} 个</div>
                      </div>
                      <div>
                        <span className="text-gray-500">跳过修复:</span>
                        <div className="font-medium">{result.failedFixes.length} 个</div>
                      </div>
                      <div>
                        <span className="text-gray-500">耗时:</span>
                        <div className="font-medium">{Math.round(result.totalTime / 1000)}s</div>
                      </div>
                    </div>

                    {result.improvements.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-500 mb-2">性能提升</div>
                        {result.improvements.map((improvement, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm">{improvement.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {Math.round(improvement.before)} → {Math.round(improvement.after)}
                              </span>
                              <Badge variant="secondary">
                                +{Math.round(improvement.after - improvement.before)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
