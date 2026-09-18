"use client"

import { ArrowLeft, CheckCircle, Circle, Clock, Target } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface LearningStep {
  id: string
  title: string
  description: string
  duration: number
  difficulty: "beginner" | "intermediate" | "advanced"
  completed: boolean
  resources: string[]
}

export default function CreateLearningPathPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const concept = searchParams.get("concept") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [learningPath, setLearningPath] = useState<LearningStep[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe">("idle")
  const [isListening, setIsListening] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // 生成学习路径
  useEffect(() => {
    const generatePath = async () => {
      setIsGenerating(true)

      // 模拟AI生成学习路径
      await new Promise<void>((resolve) => setTimeout(resolve, 2500))

      const steps: LearningStep[] = [
        {
          id: "1",
          title: "基础概念理解",
          description: `深入理解${concept}的核心概念和基本原理`,
          duration: 45,
          difficulty: "beginner",
          completed: false,
          resources: ["理论文档", "入门视频", "基础练习"],
        },
        {
          id: "2",
          title: "实践操作入门",
          description: `通过简单的实例开始实践${concept}`,
          duration: 60,
          difficulty: "beginner",
          completed: false,
          resources: ["实践指南", "示例代码", "练习题"],
        },
        {
          id: "3",
          title: "进阶技能培养",
          description: `掌握${concept}的高级应用和技巧`,
          duration: 90,
          difficulty: "intermediate",
          completed: false,
          resources: ["进阶教程", "案例分析", "项目实战"],
        },
        {
          id: "4",
          title: "综合项目实战",
          description: `运用${concept}完成一个完整的项目`,
          duration: 120,
          difficulty: "advanced",
          completed: false,
          resources: ["项目模板", "技术文档", "导师指导"],
        },
        {
          id: "5",
          title: "知识巩固与拓展",
          description: `巩固所学知识并探索${concept}的前沿发展`,
          duration: 75,
          difficulty: "advanced",
          completed: false,
          resources: ["前沿资料", "社区讨论", "持续学习"],
        },
      ]

      setLearningPath(steps)
      setIsGenerating(false)
    }

    if (concept) {
      generatePath()
    }
  }, [concept])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = e.clientX
      setGestureMode("swipe")
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      const deltaX = e.clientX - startX

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0 && currentStep > 0) {
          // 右滑 - 上一步
          setCurrentStep((prev) => prev - 1)
          if ("vibrate" in navigator) navigator.vibrate(100)
        } else if (deltaX < 0 && currentStep < learningPath.length - 1) {
          // 左滑 - 下一步
          setCurrentStep((prev) => prev + 1)
          if ("vibrate" in navigator) navigator.vibrate(100)
        }
        isPointerDown = false
        setTimeout(() => setGestureMode("idle"), 300)
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
  }, [currentStep, learningPath.length])

  // 语音控制
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.lang = "zh-CN"

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1]?.[0]
        if (!lastResult) return
        const command = (lastResult.transcript as string).toLowerCase()

        if (command.includes("下一步") || command.includes("下一个")) {
          if (currentStep < learningPath.length - 1) {
            setCurrentStep((prev) => prev + 1)
          }
        } else if (command.includes("上一步") || command.includes("上一个")) {
          if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1)
          }
        } else if (command.includes("完成") || command.includes("标记完成")) {
          const stepId = learningPath[currentStep]?.id
          if (stepId) completeStep(stepId)
        } else if (command.includes("返回")) {
          router.back()
        }
      }

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.start()

      return () => recognition.stop()
    }
    return undefined
  }, [currentStep, learningPath, router])

  // 完成步骤
  const completeStep = (stepId: string) => {
    setLearningPath((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: !step.completed } : step)))

    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-400 bg-green-400/20"
      case "intermediate":
        return "text-yellow-400 bg-yellow-400/20"
      case "advanced":
        return "text-red-400 bg-red-400/20"
      default:
        return "text-gray-400 bg-gray-400/20"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "入门"
      case "intermediate":
        return "进阶"
      case "advanced":
        return "高级"
      default:
        return "未知"
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-blue-400/30 rounded-full animate-spin border-t-blue-400"></div>
            <Target className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">AI正在制定学习路径</h2>
          <p className="text-gray-400 mb-2">分析知识结构...</p>
          <p className="text-gray-400">规划学习进度...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部导航 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">{concept} - 学习路径</h1>
          </div>

          <div className="text-white text-sm">
            步骤 {currentStep + 1} / {learningPath.length}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-6">
        {learningPath.length > 0 && (
          <div className="max-w-4xl mx-auto">
            {/* 进度条 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">学习进度</h2>
                <div className="text-gray-400 text-sm">
                  {learningPath.filter((step) => step.completed).length} / {learningPath.length} 已完成
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(learningPath.filter((step) => step.completed).length / learningPath.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* 当前步骤详情 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      onClick={() => {
                        const step = learningPath[currentStep]
                        if (step) completeStep(step.id)
                      }}
                      className="flex-shrink-0"
                    >
                      {learningPath[currentStep]?.completed ? (
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      ) : (
                        <Circle className="w-8 h-8 text-gray-400 hover:text-white transition-colors" />
                      )}
                    </button>
                    <h3 className="text-2xl font-bold text-white">{learningPath[currentStep]?.title}</h3>
                  </div>

                  <p className="text-gray-300 text-lg mb-6 leading-relaxed">{learningPath[currentStep]?.description}</p>

                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-white">{learningPath[currentStep]?.duration ?? 0} 分钟</span>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(learningPath[currentStep]?.difficulty ?? "beginner")}`}
                    >
                      {getDifficultyLabel(learningPath[currentStep]?.difficulty ?? "beginner")}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">学习资源</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(learningPath[currentStep]?.resources ?? []).map((resource, index) => (
                        <div
                          key={index}
                          className="bg-white/10 rounded-lg p-3 text-center text-white text-sm hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {resource}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 步骤导航 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {learningPath.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${index === currentStep
                    ? "bg-purple-500/20 border-purple-400/50 scale-105"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">步骤 {index + 1}</span>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <h4 className="text-white text-sm font-medium mb-1">{step.title}</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{step.duration}分钟</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 交互提示 */}
            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>左右滑动切换步骤 • 语音说"下一步"或"完成" • 点击圆圈标记完成</p>
            </div>
          </div>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-2">
        {isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <div className="w-5 h-5 text-red-400 animate-pulse">🎤</div>
          </div>
        )}
        {gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <div className="w-5 h-5 text-blue-400">👆</div>
          </div>
        )}
      </div>
    </div>
  )
}
