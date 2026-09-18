"use client"

import { gestureUtils, voiceUtils } from "@/lib/utils"
import { ArrowLeft, Download, Eye, Hand, ImageIcon, Layout, Mic, Palette, Share2, Type } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface PosterTemplate {
  id: string
  name: string
  category: string
  background: string
  textColor: string
  layout: "minimal" | "creative" | "business" | "event"
  preview: string
}

interface PosterContent {
  title: string
  subtitle: string
  description: string
  callToAction: string
}

export default function PosterGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [templates] = useState<PosterTemplate[]>([
    {
      id: "1",
      name: "现代简约",
      category: "商务",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      layout: "minimal",
      preview: "/placeholder.svg?height=400&width=300&text=现代简约",
    },
    {
      id: "2",
      name: "创意艺术",
      category: "创意",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      textColor: "#ffffff",
      layout: "creative",
      preview: "/placeholder.svg?height=400&width=300&text=创意艺术",
    },
    {
      id: "3",
      name: "商务专业",
      category: "商务",
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      textColor: "#ffffff",
      layout: "business",
      preview: "/placeholder.svg?height=400&width=300&text=商务专业",
    },
    {
      id: "4",
      name: "活动宣传",
      category: "活动",
      background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      textColor: "#ffffff",
      layout: "event",
      preview: "/placeholder.svg?height=400&width=300&text=活动宣传",
    },
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate | null>(templates[0] ?? null)
  const [posterContent, setPosterContent] = useState<PosterContent>({
    title: query || "标题文字",
    subtitle: "副标题文字",
    description: "这里是详细描述内容，可以包含更多信息和细节。",
    callToAction: "立即行动",
  })

  const [isGenerating, setIsGenerating] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe" | "pinch">("idle")
  const [editMode, setEditMode] = useState<"template" | "content" | "preview">("template")

  const containerRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)

  // 初始化生成
  useEffect(() => {
    const initializePoster = async () => {
      setIsGenerating(true)

      // 模拟AI分析和生成过程
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 根据查询内容智能选择模板
      if (query.includes("商务") || query.includes("专业")) {
        setSelectedTemplate(templates[2] ?? null)
      } else if (query.includes("活动") || query.includes("宣传")) {
        setSelectedTemplate(templates[3] ?? null)
      } else if (query.includes("创意") || query.includes("艺术")) {
        setSelectedTemplate(templates[1] ?? null)
      }

      setIsGenerating(false)
    }

    initializePoster()
  }, [query, templates])

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
        const currentIndex = templates.findIndex((t) => t.id === selectedTemplate?.id)

        if (deltaX > 0 && currentIndex > 0) {
          // 右滑 - 上一个模板
          setSelectedTemplate(templates[currentIndex - 1] ?? null)
          gestureUtils.hapticFeedback(100)
        } else if (deltaX < 0 && currentIndex < templates.length - 1) {
          // 左滑 - 下一个模板
          setSelectedTemplate(templates[currentIndex + 1] ?? null)
          gestureUtils.hapticFeedback(100)
        }
        isPointerDown = false
      }

      if (Math.abs(deltaY) > 100) {
        if (deltaY > 0) {
          // 下滑 - 切换到内容编辑
          setEditMode("content")
        } else {
          // 上滑 - 切换到预览模式
          setEditMode("preview")
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
  }, [selectedTemplate, templates])

  // 语音控制
  useEffect(() => {
    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        const command = transcript.toLowerCase()

        if (command.includes("下一个模板")) {
          const currentIndex = templates.findIndex((t) => t.id === selectedTemplate?.id)
          if (currentIndex < templates.length - 1) {
            setSelectedTemplate(templates[currentIndex + 1] ?? null)
          }
        } else if (command.includes("上一个模板")) {
          const currentIndex = templates.findIndex((t) => t.id === selectedTemplate?.id)
          if (currentIndex > 0) {
            setSelectedTemplate(templates[currentIndex - 1] ?? null)
          }
        } else if (command.includes("预览模式")) {
          setEditMode("preview")
        } else if (command.includes("编辑模式")) {
          setEditMode("content")
        } else if (command.includes("模板选择")) {
          setEditMode("template")
        } else if (command.includes("返回")) {
          router.back()
        }
      },
      () => setIsListening(true),
      () => setIsListening(false),
    )

    recognition?.start()
    return () => recognition?.stop()
  }, [selectedTemplate, templates, router])

  // 更新海报内容
  const updateContent = (field: keyof PosterContent, value: string) => {
    setPosterContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-pink-400/30 rounded-full animate-spin border-t-pink-400"></div>
            <ImageIcon className="w-10 h-10 text-pink-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">AI正在设计海报</h2>
          <p className="text-gray-400 mb-2">分析设计需求...</p>
          <p className="text-gray-400">生成创意方案...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative"
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">海报设计器</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditMode("template")}
              className={`p-2 rounded-full transition-colors ${editMode === "template"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-white/10 text-white hover:bg-white/20"
                }`}
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              onClick={() => setEditMode("content")}
              className={`p-2 rounded-full transition-colors ${editMode === "content" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white hover:bg-white/20"
                }`}
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => setEditMode("preview")}
              className={`p-2 rounded-full transition-colors ${editMode === "preview" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white hover:bg-white/20"
                }`}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pt-20 pb-8 px-6 h-screen flex">
        {/* 侧边栏 */}
        {editMode !== "preview" && (
          <div className="w-80 mr-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 overflow-y-auto">
            {editMode === "template" && (
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  选择模板
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${template.id === selectedTemplate?.id ? "ring-2 ring-purple-400 scale-105" : "hover:scale-102"
                        }`}
                    >
                      <div
                        className="aspect-[3/4] p-4 flex flex-col justify-center items-center text-center"
                        style={{ background: template.background }}
                      >
                        <div className="text-white font-bold text-sm mb-2">{template.name}</div>
                        <div className="text-white/80 text-xs">{template.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editMode === "content" && (
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  编辑内容
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm mb-2">标题</label>
                    <input
                      type="text"
                      value={posterContent.title}
                      onChange={(e) => updateContent("title", e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="输入标题..."
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-2">副标题</label>
                    <input
                      type="text"
                      value={posterContent.subtitle}
                      onChange={(e) => updateContent("subtitle", e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="输入副标题..."
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-2">描述</label>
                    <textarea
                      value={posterContent.description}
                      onChange={(e) => updateContent("description", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      placeholder="输入描述内容..."
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-2">行动号召</label>
                    <input
                      type="text"
                      value={posterContent.callToAction}
                      onChange={(e) => updateContent("callToAction", e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="输入行动号召..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 海报预览区域 */}
        <div className="flex-1 flex items-center justify-center">
          <div
            ref={posterRef}
            className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${editMode === "preview" ? "w-full max-w-2xl aspect-[3/4]" : "w-96 aspect-[3/4]"
              }`}
            style={{ background: selectedTemplate?.background }}
          >
            <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
              {/* 标题区域 */}
              <div className="text-center">
                <h1 className={`font-bold mb-4 ${editMode === "preview" ? "text-5xl" : "text-3xl"}`}>
                  {posterContent.title}
                </h1>
                <h2 className={`font-medium opacity-90 ${editMode === "preview" ? "text-2xl" : "text-xl"}`}>
                  {posterContent.subtitle}
                </h2>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 flex items-center justify-center">
                <p
                  className={`text-center leading-relaxed opacity-80 ${editMode === "preview" ? "text-xl" : "text-base"}`}
                >
                  {posterContent.description}
                </p>
              </div>

              {/* 行动号召区域 */}
              <div className="text-center">
                <div
                  className={`inline-block px-8 py-3 bg-white/20 backdrop-blur-sm rounded-full font-medium ${editMode === "preview" ? "text-xl" : "text-base"
                    }`}
                >
                  {posterContent.callToAction}
                </div>
              </div>
            </div>

            {/* 装饰元素 */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/10 rounded-full"></div>
          </div>
        </div>
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
          <p>👆 左右滑动: 切换模板</p>
          <p>📱 上下滑动: 切换编辑模式</p>
          <p>🗣️ 语音: "下一个模板"、"预览模式"</p>
          <p>✏️ 点击工具栏: 快速切换功能</p>
        </div>
      </div>
    </div>
  )
}
