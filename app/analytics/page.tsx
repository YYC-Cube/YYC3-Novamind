"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Eye,
  Hand,
  Mic,
  Brain,
  Zap,
  Target,
  Award,
  Activity,
} from "lucide-react"
import { voiceUtils } from "@/lib/utils"

interface AnalyticsData {
  usage: {
    totalSessions: number
    totalTime: number
    averageSessionTime: number
    dailyActive: number
  }
  interactions: {
    voice: number
    gesture: number
    eyeTracking: number
    text: number
  }
  features: {
    search: number
    generate: number
    chat: number
    learn: number
  }
  performance: {
    responseTime: number
    accuracy: number
    satisfaction: number
    efficiency: number
  }
  trends: {
    date: string
    sessions: number
    interactions: number
    satisfaction: number
  }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("week")
  const [selectedMetric, setSelectedMetric] = useState<"usage" | "interactions" | "features" | "performance">("usage")
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe">("idle")

  const containerRef = useRef<HTMLDivElement>(null)

  // 初始化分析数据
  useEffect(() => {
    const loadAnalyticsData = async () => {
      // 模拟加载分析数据
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData: AnalyticsData = {
        usage: {
          totalSessions: 156,
          totalTime: 18420, // 秒
          averageSessionTime: 118, // 秒
          dailyActive: 12,
        },
        interactions: {
          voice: 342,
          gesture: 189,
          eyeTracking: 67,
          text: 234,
        },
        features: {
          search: 89,
          generate: 45,
          chat: 67,
          learn: 23,
        },
        performance: {
          responseTime: 1.2, // 秒
          accuracy: 94.5, // 百分比
          satisfaction: 4.6, // 5分制
          efficiency: 87.3, // 百分比
        },
        trends: [
          { date: "2024-01-01", sessions: 12, interactions: 45, satisfaction: 4.2 },
          { date: "2024-01-02", sessions: 15, interactions: 52, satisfaction: 4.4 },
          { date: "2024-01-03", sessions: 18, interactions: 61, satisfaction: 4.5 },
          { date: "2024-01-04", sessions: 14, interactions: 48, satisfaction: 4.3 },
          { date: "2024-01-05", sessions: 20, interactions: 67, satisfaction: 4.7 },
          { date: "2024-01-06", sessions: 16, interactions: 55, satisfaction: 4.4 },
          { date: "2024-01-07", sessions: 22, interactions: 73, satisfaction: 4.8 },
        ],
      }

      setAnalyticsData(mockData)
    }

    loadAnalyticsData()
  }, [selectedPeriod])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = e.clientX
      startY = e.clientY
      setGestureMode("swipe")
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          // 右滑返回
          router.back()
          isPointerDown = false
        }
      }

      if (Math.abs(deltaY) > 100) {
        const metrics = ["usage", "interactions", "features", "performance"]
        const currentIndex = metrics.indexOf(selectedMetric)

        if (deltaY > 0 && currentIndex > 0) {
          // 下滑 - 上一个指标
          setSelectedMetric(metrics[currentIndex - 1] as any)
        } else if (deltaY < 0 && currentIndex < metrics.length - 1) {
          // 上滑 - 下一个指标
          setSelectedMetric(metrics[currentIndex + 1] as any)
        }
        isPointerDown = false
      }
    }

    const handlePointerUp = () => {
      isPointerDown = false
      setTimeout(() => setGestureMode("idle"), 300)
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [selectedMetric, router])

  // 语音控制
  useEffect(() => {
    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        const command = transcript.toLowerCase()

        if (command.includes("使用统计")) {
          setSelectedMetric("usage")
        } else if (command.includes("交互分析")) {
          setSelectedMetric("interactions")
        } else if (command.includes("功能使用")) {
          setSelectedMetric("features")
        } else if (command.includes("性能指标")) {
          setSelectedMetric("performance")
        } else if (command.includes("今天") || command.includes("日")) {
          setSelectedPeriod("day")
        } else if (command.includes("本周") || command.includes("周")) {
          setSelectedPeriod("week")
        } else if (command.includes("本月") || command.includes("月")) {
          setSelectedPeriod("month")
        } else if (command.includes("返回")) {
          router.back()
        }
      },
      () => setIsListening(true),
      () => setIsListening(false),
    )

    recognition?.start()
    return () => recognition?.stop()
  }, [router])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-blue-400/30 rounded-full animate-spin border-t-blue-400"></div>
            <BarChart3 className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">正在加载分析数据</h2>
          <p className="text-gray-400">分析使用模式和性能指标...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部工具栏 */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold text-white">使用分析</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedPeriod === period
                    ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                    : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                }`}
              >
                {period === "day" ? "今日" : period === "week" ? "本周" : "本月"}
              </button>
            ))}
          </div>
        </div>

        {/* 指标导航 */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { key: "usage", label: "使用统计", icon: Activity },
            { key: "interactions", label: "交互分析", icon: Hand },
            { key: "features", label: "功能使用", icon: Target },
            { key: "performance", label: "性能指标", icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === key
                  ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分析内容 */}
      <div className="px-6 py-6">
        {/* 使用统计 */}
        {selectedMetric === "usage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.usage.totalSessions}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">总会话数</h3>
                <p className="text-sm text-gray-400">累计使用次数</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-white">{formatTime(analyticsData.usage.totalTime)}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">总使用时长</h3>
                <p className="text-sm text-gray-400">累计活跃时间</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-white">
                    {formatTime(analyticsData.usage.averageSessionTime)}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">平均会话时长</h3>
                <p className="text-sm text-gray-400">单次使用平均时间</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.usage.dailyActive}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">日活跃度</h3>
                <p className="text-sm text-gray-400">今日使用次数</p>
              </div>
            </div>

            {/* 趋势图 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">使用趋势</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analyticsData.trends.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500 hover:from-blue-400 hover:to-purple-400"
                      style={{ height: `${(trend.sessions / 25) * 100}%` }}
                    />
                    <span className="text-xs text-gray-400 mt-2">{new Date(trend.date).getDate()}日</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 交互分析 */}
        {selectedMetric === "interactions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Mic className="w-8 h-8 text-red-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.interactions.voice}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">语音交互</h3>
                <p className="text-sm text-gray-400">语音命令次数</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Hand className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.interactions.gesture}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">手势操作</h3>
                <p className="text-sm text-gray-400">手势识别次数</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.interactions.eyeTracking}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">眼动追踪</h3>
                <p className="text-sm text-gray-400">注视操作次数</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.interactions.text}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">文字输入</h3>
                <p className="text-sm text-gray-400">键盘输入次数</p>
              </div>
            </div>

            {/* 交互方式分布 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">交互方式分布</h3>
              <div className="space-y-4">
                {Object.entries(analyticsData.interactions).map(([key, value]) => {
                  const total = Object.values(analyticsData.interactions).reduce((a, b) => a + b, 0)
                  const percentage = (value / total) * 100
                  const colors = {
                    voice: "bg-red-500",
                    gesture: "bg-blue-500",
                    eyeTracking: "bg-green-500",
                    text: "bg-purple-500",
                  }
                  const labels = {
                    voice: "语音交互",
                    gesture: "手势操作",
                    eyeTracking: "眼动追踪",
                    text: "文字输入",
                  }

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{labels[key as keyof typeof labels]}</span>
                        <span className="text-white">
                          {value} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${colors[key as keyof typeof colors]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 功能使用 */}
        {selectedMetric === "features" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(analyticsData.features).map(([key, value]) => {
                const icons = {
                  search: { icon: BarChart3, color: "text-blue-400" },
                  generate: { icon: Award, color: "text-green-400" },
                  chat: { icon: Mic, color: "text-purple-400" },
                  learn: { icon: Target, color: "text-orange-400" },
                }
                const labels = {
                  search: "智能搜索",
                  generate: "内容生成",
                  chat: "AI对话",
                  learn: "学习路径",
                }
                const IconComponent = icons[key as keyof typeof icons].icon
                const iconColor = icons[key as keyof typeof icons].color

                return (
                  <div key={key} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className={`w-8 h-8 ${iconColor}`} />
                      <span className="text-2xl font-bold text-white">{value}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">{labels[key as keyof typeof labels]}</h3>
                    <p className="text-sm text-gray-400">使用次数</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 性能指标 */}
        {selectedMetric === "performance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.performance.responseTime}s</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">响应时间</h3>
                <p className="text-sm text-gray-400">平均响应延迟</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.performance.accuracy}%</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">识别准确率</h3>
                <p className="text-sm text-gray-400">AI识别精度</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.performance.satisfaction}/5</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">用户满意度</h3>
                <p className="text-sm text-gray-400">平均评分</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{analyticsData.performance.efficiency}%</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">操作效率</h3>
                <p className="text-sm text-gray-400">任务完成效率</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-2">
        {isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <Mic className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        )}
        {gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <Hand className="w-5 h-5 text-blue-400" />
          </div>
        )}
      </div>

      {/* 交互提示 */}
      <div className="fixed bottom-8 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>👆 右滑: 返回上页</p>
          <p>📱 上下滑动: 切换指标类型</p>
          <p>🗣️ 语音: &quot;使用统计&quot;、&quot;交互分析&quot;</p>
          <p>📊 实时更新: 数据自动刷新</p>
        </div>
      </div>
    </div>
  )
}
