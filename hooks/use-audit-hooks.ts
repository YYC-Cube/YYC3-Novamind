import { useState, useEffect } from 'react'

// 审核进度状态钩子
export function useAuditProgress() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0)

  const startProgress = (totalSteps: number = 5) => {
    setIsRunning(true)
    setProgress(0)
    setEstimatedTimeLeft(totalSteps * 30) // 估计每步30秒

    const steps = [
      '初始化审核引擎...',
      '收集项目指标...',
      '分析代码质量...',
      '评估性能表现...',
      '生成优化建议...',
      '完成审核报告...'
    ]

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        const step = steps[currentIndex]
        if (!step) return
        setCurrentStep(step)
        setProgress((currentIndex + 1) / steps.length * 100)
        setEstimatedTimeLeft(prev => Math.max(0, prev - 30))
        currentIndex++
      } else {
        setIsRunning(false)
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }

  return {
    progress,
    currentStep,
    isRunning,
    estimatedTimeLeft,
    startProgress
  }
}

// 实时状态监控钩子
export function useAuditStatusMonitor() {
  // lastCheck 初始为 null：避免 SSR 与客户端 new Date() 值不一致导致水合不匹配
  const [status, setStatus] = useState<{
    isHealthy: boolean
    lastCheck: Date | null
    activeAudits: number
    queuedAudits: number
    systemLoad: number
  }>({
    isHealthy: true,
    lastCheck: null,
    activeAudits: 0,
    queuedAudits: 0,
    systemLoad: 0
  })

  useEffect(() => {
    const checkStatus = () => {
      // 模拟状态检查
      setStatus(prev => ({
        ...prev,
        lastCheck: new Date(),
        systemLoad: Math.random() * 100,
        isHealthy: Math.random() > 0.1 // 90% 健康概率
      }))
    }

    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return status
}

// 审核历史跟踪钩子
export function useAuditHistory(projectId: string) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        // 模拟加载历史数据
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 生成模拟历史数据
        const mockHistory = Array.from({ length: 10 }, (_, i) => ({
          id: `audit-${i}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          score: 70 + Math.random() * 25,
          status: 'completed',
          duration: Math.floor(180 + Math.random() * 120) // 3-5 分钟
        }))

        setHistory(mockHistory)
      } catch (error) {
        console.error('加载审核历史失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [projectId])

  return { history, isLoading }
}

// 性能指标监控钩子
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    responseTime: 0,
    errorRate: 0
  })

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        memoryUsage: 40 + Math.random() * 30,
        cpuUsage: 20 + Math.random() * 40,
        activeConnections: Math.floor(10 + Math.random() * 50),
        responseTime: 150 + Math.random() * 300,
        errorRate: Math.random() * 2
      })
    }

    const interval = setInterval(updateMetrics, 2000)
    updateMetrics()
    
    return () => clearInterval(interval)
  }, [])

  return metrics
}

// 智能建议跟踪钩子
export function useRecommendationTracking() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<string[]>([])

  const completeTask = (taskId: string) => {
    setCompletedTasks(prev => [...prev, taskId])
  }

  const addRecommendation = (recommendation: any) => {
    setRecommendations(prev => [recommendation, ...prev])
  }

  const getCompletionProgress = () => {
    const totalTasks = recommendations.flatMap(rec => rec.actionItems).length
    return totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0
  }

  return {
    recommendations,
    completedTasks,
    completeTask,
    addRecommendation,
    completionProgress: getCompletionProgress()
  }
}