"use client"

import { learningPathManager, type LearningPath, type LearningStep } from "@/lib/learning-path"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  MoreVertical,
  Share2,
  Star,
  Target,
  TrendingUp,
  Video,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LearningPathDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pathId = params.id as string

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [_activeStep, setActiveStep] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [showMenu, setShowMenu] = useState(false)

  const isStepCompleted = (step: LearningStep) => step.status === "completed"

  const computeProgress = (path: LearningPath) => {
    const total = path.steps.length
    const completed = path.steps.filter(isStepCompleted).length
    return total > 0 ? (completed / total) * 100 : 0
  }

  const loadLearningPath = () => {
    const path = learningPathManager.getPath(pathId)
    if (path) {
      setLearningPath(path)
    } else {
      router.push("/learning-paths")
    }
  }

  const handleStepToggle = (stepId: string) => {
    if (!learningPath) return

    const step = learningPath.steps.find((s) => s.id === stepId)
    if (!step) return

    step.status = isStepCompleted(step) ? "not-started" : "completed"
    step.progress = isStepCompleted(step) ? 100 : 0
    step.completedAt = isStepCompleted(step) ? new Date() : undefined
    learningPathManager.updatePath(pathId, { steps: learningPath.steps })
    loadLearningPath()
  }

  const handleSaveNotes = (stepId: string) => {
    if (!learningPath) return

    const step = learningPath.steps.find((s) => s.id === stepId)
    if (!step) return

    step.notes = noteText
    learningPathManager.updatePath(pathId, { steps: learningPath.steps })
    setShowNotes(null)
    setNoteText("")
    loadLearningPath()
  }

  const getStepIcon = (type: LearningStep["type"]) => {
    switch (type) {
      case "concept":
        return <BookOpen className="w-5 h-5" />
      case "practice":
        return <Target className="w-5 h-5" />
      case "reading":
        return <FileText className="w-5 h-5" />
      case "assessment":
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Circle className="w-5 h-5" />
    }
  }

  const getStepColor = (type: LearningStep["type"]) => {
    switch (type) {
      case "concept":
        return "bg-blue-100 text-blue-600"
      case "practice":
        return "bg-green-100 text-green-600"
      case "reading":
        return "bg-orange-100 text-orange-600"
      case "assessment":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-white/10 text-gray-400"
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "article":
        return <FileText className="w-4 h-4" />
      case "book":
        return <BookOpen className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  const getNextSteps = () => {
    if (!learningPath) return []
    return learningPath.steps.filter(
      (step) => step.status !== "completed" && step.prerequisites.every((p) => learningPath.steps.find((s) => s.id === p)?.status === "completed"),
    )
  }

  const getPathStats = () => {
    if (!learningPath) return null
    const totalSteps = learningPath.steps.length
    const completedSteps = learningPath.steps.filter(isStepCompleted).length
    const completedTime = learningPath.steps
      .filter(isStepCompleted)
      .reduce((sum, s) => sum + s.estimatedTime, 0)
    const totalEstimatedTime = learningPath.steps.reduce((sum, s) => sum + s.estimatedTime, 0)
    const averageStepDifficulty =
      totalSteps > 0 ? learningPath.steps.reduce((sum, s) => sum + s.difficulty, 0) / totalSteps : 0
    return {
      totalSteps,
      completedSteps,
      completedTime,
      totalEstimatedTime,
      averageStepDifficulty,
      progress: computeProgress(learningPath),
    }
  }

  useEffect(() => {
    loadLearningPath()
  }, [pathId])

  if (!learningPath) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载学习路径中...</p>
        </div>
      </div>
    )
  }

  const nextSteps = getNextSteps()
  const stats = getPathStats()
  const pathProgress = stats?.progress ?? 0

  return (
    <div className="min-h-screen bg-surface-panel">
      {/* 顶部导航栏 */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div style={{ viewTransitionName: `path-card-${pathId}` }}>
            <h1 className="text-lg font-medium">{learningPath.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>进度: {Math.round(pathProgress)}%</span>
              <span>状态: {pathProgress >= 100 ? "已完成" : "进行中"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/10 rounded">
            <Share2 className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  编辑路径
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 进度概览 */}
            <div className="bg-surface-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">学习进度</h2>
                <div className="text-2xl font-bold text-blue-600">{Math.round(pathProgress)}%</div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${pathProgress}%` }}
                />
              </div>
              {stats && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-white">{stats.completedSteps}</div>
                    <div className="text-sm text-gray-400">已完成</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{stats.totalSteps}</div>
                    <div className="text-sm text-gray-400">总步骤</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{formatTime(stats.completedTime)}</div>
                    <div className="text-sm text-gray-400">已学习</div>
                  </div>
                </div>
              )}
            </div>

            {/* 推荐下一步 */}
            {nextSteps.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">建议下一步</h3>
                </div>
                <div className="space-y-2">
                  {nextSteps.slice(0, 2).map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-surface-card rounded-lg">
                      <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>{getStepIcon(step.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{step.title}</h4>
                        <p className="text-sm text-gray-400">{formatTime(step.estimatedTime)}</p>
                      </div>
                      <button
                        onClick={() => setActiveStep(step.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        开始
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 学习步骤列表 */}
            <div className="bg-surface-card rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-white">学习步骤</h2>
              </div>
              <div className="divide-y">
                {learningPath.steps.map((step, _index) => (
                  <div key={step.id} className="p-6">
                    <div className="flex items-start gap-4">
                      {/* 步骤状态 */}
                      <button
                        onClick={() => handleStepToggle(step.id)}
                        className={`mt-1 p-1 rounded-full transition-colors ${isStepCompleted(step) ? "text-green-600" : "text-gray-400 hover:text-blue-600"
                          }`}
                      >
                        {isStepCompleted(step) ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>

                      <div className="flex-1">
                        {/* 步骤头部 */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1 rounded ${getStepColor(step.type)}`}>{getStepIcon(step.type)}</div>
                          <h3
                            className={`font-medium ${isStepCompleted(step) ? "text-gray-400 line-through" : "text-white"}`}
                          >
                            {step.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(step.estimatedTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              <span>{step.difficulty}星</span>
                            </div>
                          </div>
                        </div>

                        {/* 步骤描述 */}
                        <p className="text-gray-400 mb-4">{step.description}</p>

                        {/* 学习资源 */}
                        {step.resources.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-white mb-2">学习资源</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {step.resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/10"
                                >
                                  <div className="text-gray-400">{getResourceIcon(resource.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-white truncate">{resource.title}</h5>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <span>{resource.duration ? formatTime(resource.duration) : "时长未知"}</span>
                                      {resource.rating && (
                                        <>
                                          <span>•</span>
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span>{resource.rating}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 笔记区域 */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setShowNotes(step.id)
                              setNoteText(step.notes || "")
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {step.notes ? "查看笔记" : "添加笔记"}
                          </button>
                          {step.completedAt && (
                            <span className="text-sm text-gray-400">
                              完成于 {new Date(step.completedAt).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                        </div>

                        {/* 笔记编辑 */}
                        {showNotes === step.id && (
                          <div className="mt-4 p-4 bg-white/5 rounded-lg">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="记录学习心得、重点内容或疑问..."
                              rows={3}
                              className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                            />
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => handleSaveNotes(step.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setShowNotes(null)}
                                className="px-3 py-1 text-gray-400 hover:bg-white/10 rounded text-sm"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="space-y-6">
            {/* 路径信息 */}
            <div className="bg-surface-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">路径信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">总时长:</span>
                  <span className="font-medium">{formatTime(stats?.totalEstimatedTime ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">创建时间:</span>
                  <span className="font-medium">{new Date(learningPath.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">最后更新:</span>
                  <span className="font-medium">{new Date(learningPath.updatedAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            </div>

            {/* 学习统计 */}
            {stats && (
              <div className="bg-surface-card rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-white mb-4">学习统计</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>完成率</span>
                      <span>{Math.round(stats.progress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.progress}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>时间进度</span>
                      <span>{Math.round((stats.completedTime / stats.totalEstimatedTime) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(stats.completedTime / stats.totalEstimatedTime) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-400">平均难度: {stats.averageStepDifficulty.toFixed(1)} 星</div>
                  </div>
                </div>
              </div>
            )}

            {/* 快速操作 */}
            <div className="bg-surface-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">快速操作</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  生成学习报告
                </button>
                <button className="w-full px-4 py-2 border border-white/20 text-gray-200 rounded-lg hover:bg-white/10 text-sm">
                  导出学习计划
                </button>
                <button className="w-full px-4 py-2 border border-white/20 text-gray-200 rounded-lg hover:bg-white/10 text-sm">
                  分享给朋友
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {showMenu && <div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />}
    </div>
  )
}
