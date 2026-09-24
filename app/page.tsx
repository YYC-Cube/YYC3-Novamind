"use client"

import { Activity, BookOpen, Brain, Eye, Globe, Hand, History, ImageIcon, LayoutTemplate, Mic, Network, Presentation, Search, ShieldCheck, Sparkles, Star, Zap } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/** 功能菜单：核心能力统一入口（路由与全站页面 1:1 对齐） */
const featureMenu = [
  { label: "智能搜索", desc: "多模态检索", icon: Search, href: "/search" },
  { label: "思维导图", desc: "结构化知识", icon: Brain, href: "/generate/mindmap" },
  { label: "海报生成", desc: "六主题 SVG", icon: ImageIcon, href: "/generate/poster" },
  { label: "PPT 生成", desc: "演示文稿", icon: Presentation, href: "/generate/ppt" },
  { label: "网页生成", desc: "单页落地", icon: Globe, href: "/generate/webpage" },
  { label: "学习路径", desc: "个性化规划", icon: BookOpen, href: "/learning-path/create" },
  { label: "知识图谱", desc: "关联探索", icon: Network, href: "/knowledge-graph" },
  { label: "历史记录", desc: "会话回溯", icon: History, href: "/history" },
  { label: "收藏夹", desc: "内容管理", icon: Star, href: "/favorites" },
  { label: "模板中心", desc: "快速起步", icon: LayoutTemplate, href: "/templates" },
  { label: "系统状态", desc: "服务健康", icon: Activity, href: "/system-status" },
  { label: "全局审核", desc: "多维度评估", icon: ShieldCheck, href: "/global-audit-home" },
]

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isGazing, setIsGazing] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "pan" | "pinch" | "swipe">("idle")
  const [voiceCommand, setVoiceCommand] = useState("")
  const [contextualActions, setContextualActions] = useState<string[]>([])
  const [userIntent, setUserIntent] = useState<"search" | "generate" | "learn" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // 语音识别系统
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "zh-CN"

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          handleVoiceCommand(finalTranscript)
        }
        setVoiceCommand(interimTranscript)
      }
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      // 自动启动语音识别
      recognition.start()

      return () => recognition.stop()
    }
    return undefined
  }, [])

  // 手势识别系统
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0,
      currentX = 0,
      currentY = 0
    let isPointerDown = false
    let gestureStartTime = 0

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = currentX = e.clientX
      startY = currentY = e.clientY
      gestureStartTime = Date.now()

      // 触觉反馈
      if ("vibrate" in navigator) {
        navigator.vibrate(50)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      currentX = e.clientX
      currentY = e.clientY

      const deltaX = currentX - startX
      const deltaY = currentY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          setGestureMode(deltaX > 0 ? "swipe" : "swipe")
          handleSwipeGesture(deltaX > 0 ? "right" : "left")
        } else {
          setGestureMode(deltaY > 0 ? "pan" : "pan")
          handlePanGesture(deltaY > 0 ? "down" : "up")
        }
      }
    }

    const handlePointerUp = () => {
      isPointerDown = false
      const gestureTime = Date.now() - gestureStartTime

      if (gestureTime < 200) {
        handleTapGesture()
      }

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
  }, [])

  // 眼动追踪模拟（基于鼠标位置）
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const distance = Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2)

      if (distance < 100) {
        setIsGazing(true)
        setTimeout(() => {
          if (distance < 100) {
            handleGazeActivation()
          }
        }, 2000)
      } else {
        setIsGazing(false)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // 上下文感知系统
  useEffect(() => {
    const analyzeContext = () => {
      const actions = []

      if (query.includes("思维导图") || query.includes("结构")) {
        actions.push("生成思维导图")
        setUserIntent("generate")
      }
      if (query.includes("学习") || query.includes("教程")) {
        actions.push("创建学习路径")
        setUserIntent("learn")
      }
      if (query.includes("PPT") || query.includes("演示")) {
        actions.push("制作演示文稿")
        setUserIntent("generate")
      }
      if (query.length > 0) {
        actions.push("智能搜索")
        if (!userIntent) setUserIntent("search")
      }

      setContextualActions(actions)
    }

    const debounce = setTimeout(analyzeContext, 300)
    return () => clearTimeout(debounce)
  }, [query, userIntent])

  // 语音命令处理
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("搜索") || lowerCommand.includes("查找")) {
      const searchQuery = command.replace(/搜索|查找/g, "").trim()
      if (searchQuery) {
        setQuery(searchQuery)
        executeSearch(searchQuery)
      }
    } else if (lowerCommand.includes("思维导图")) {
      router.push("/generate/mindmap?voice=true")
    } else if (lowerCommand.includes("学习路径")) {
      router.push("/learning-path/create?voice=true")
    } else if (lowerCommand.includes("清空")) {
      setQuery("")
    } else {
      setQuery(command)
    }
  }

  // 手势处理
  const handleSwipeGesture = (direction: "left" | "right") => {
    if (direction === "right" && contextualActions.length > 0) {
      executeContextualAction(contextualActions[0] ?? "")
    } else if (direction === "left") {
      setQuery("")
      setUserIntent(null)
    }
  }

  const handlePanGesture = (direction: "up" | "down") => {
    if (direction === "up" && query) {
      executeSearch(query)
    } else if (direction === "down") {
      router.push("/history")
    }
  }

  const handleTapGesture = () => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // 注视激活
  const handleGazeActivation = () => {
    if (query && userIntent) {
      executeSearch(query)
    }
  }

  // 执行搜索
  const executeSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // 触觉反馈
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    router.push(`/results?q=${encodeURIComponent(searchQuery)}&mode=${userIntent || "search"}`)
  }

  // 执行上下文操作
  const executeContextualAction = (action: string) => {
    switch (action) {
      case "生成思维导图":
        router.push(`/generate/mindmap?q=${encodeURIComponent(query)}`)
        break
      case "创建学习路径":
        router.push(`/learning-path/create?concept=${encodeURIComponent(query)}`)
        break
      case "制作演示文稿":
        router.push(`/generate/ppt?q=${encodeURIComponent(query)}`)
        break
      case "智能搜索":
        executeSearch(query)
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at ${isGazing ? "50% 50%" : "30% 70%"}, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
      }}
    >
      {/* 动态背景粒子（确定性伪随机：SSR 与客户端输出一致，避免水合不匹配） */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => {
          // mulberry32 种子序列：每个粒子取 4 个确定值（index 驱动，两端一致）
          const rand = (seed: number) => {
            const t = (seed + 0x6d2b79f5) | 0
            let x = Math.imul(t ^ (t >>> 15), 1 | t)
            x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
            return ((x ^ (x >>> 14)) >>> 0) / 4294967296
          }
          const base = i * 4
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${rand(base) * 100}%`,
                top: `${rand(base + 1) * 100}%`,
                animationDelay: `${rand(base + 2) * 3}s`,
                animationDuration: `${2 + rand(base + 3) * 3}s`,
              }}
            />
          )
        })}
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* 顶部品牌栏：logo + 名称 + 功能菜单入口 */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <Image
            src="/yyc3-icons/Web App/android-chrome-192.png"
            alt="NovaMind 星图智语 Logo"
            width={40}
            height={40}
            className="rounded-xl shadow-lg shadow-purple-500/30"
            priority
          />
          <div className="leading-tight">
            <div className="text-white font-semibold">NovaMind</div>
            <div className="text-gray-400 text-xs">星图智语</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="功能菜单"
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white text-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
        >
          <LayoutTemplate className="w-4 h-4" />
          功能菜单
        </button>

        {/* 功能菜单面板（12 项核心能力统一入口） */}
        {menuOpen && (
          <div className="absolute top-20 right-6 z-20 w-[min(92vw,560px)] max-h-[70vh] overflow-y-auto bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl shadow-purple-500/20 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {featureMenu.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(item.href)
                  }}
                  className="group flex flex-col items-start gap-1.5 p-4 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 text-left transition-all duration-200 hover:scale-[1.03]"
                >
                  <item.icon className="w-5 h-5 text-purple-300 group-hover:text-purple-200" />
                  <div className="text-white text-sm font-medium">{item.label}</div>
                  <div className="text-gray-400 text-xs">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 标题区域 - 响应式动画 */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${query ? "transform -translate-y-8 scale-90" : ""
            }`}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Image
              src="/yyc3-icons/Web App/android-chrome-192.png"
              alt="NovaMind Logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-xl shadow-purple-500/40"
              priority
            />
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              NovaMind
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">星图智语 · 无边界智能交互中心</p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <span className={`flex items-center ${isListening ? "text-red-400" : ""}`}>
              <Mic className="w-4 h-4 mr-1" />
              语音{isListening ? "监听中" : "待命"}
            </span>
            <span className={`flex items-center ${gestureMode !== "idle" ? "text-blue-400" : ""}`}>
              <Hand className="w-4 h-4 mr-1" />
              手势{gestureMode !== "idle" ? "识别中" : "待命"}
            </span>
            <span className={`flex items-center ${isGazing ? "text-green-400" : ""}`}>
              <Eye className="w-4 h-4 mr-1" />
              注视{isGazing ? "激活中" : "待命"}
            </span>
          </div>
        </div>

        {/* 智能输入区域 */}
        <div className="w-full max-w-4xl relative">
          <div
            className={`relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 transition-all duration-500 ${query ? "shadow-2xl shadow-purple-500/25" : "shadow-lg"
              }`}
          >
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="说出您的想法，或直接开始输入..."
              className="w-full px-8 py-6 bg-transparent text-white placeholder-gray-400 text-lg md:text-xl resize-none outline-none min-h-[120px]"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  executeSearch(query)
                }
              }}
            />

            {/* 语音实时反馈 */}
            {voiceCommand && (
              <div className="absolute bottom-4 left-8 text-sm text-blue-300 animate-pulse">
                语音输入: {voiceCommand}
              </div>
            )}

            {/* 手势状态指示 */}
            {gestureMode !== "idle" && (
              <div className="absolute top-4 right-8 text-sm text-blue-300">
                {gestureMode === "swipe" && "滑动手势"}
                {gestureMode === "pan" && "拖拽手势"}
                {gestureMode === "pinch" && "缩放手势"}
              </div>
            )}
          </div>

          {/* 上下文感知操作提示 */}
          {contextualActions.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {contextualActions.map((action, index) => (
                <div
                  key={action}
                  onClick={() => executeContextualAction(action)}
                  className={`px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl border border-white/10 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${index === 0 ? "ring-2 ring-purple-400/50" : ""
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    {action.includes("思维导图") && <Brain className="w-4 h-4" />}
                    {action.includes("搜索") && <Search className="w-4 h-4" />}
                    {action.includes("学习") && <Sparkles className="w-4 h-4" />}
                    <span>{action}</span>
                  </div>
                  {index === 0 && <div className="text-xs text-gray-400 mt-1">右滑或注视2秒激活</div>}
                </div>
              ))}
            </div>
          )}

          {/* 全局审核系统快速入口 */}
          <div className="mt-8 flex justify-center">
            <div
              onClick={() => router.push('/global-audit-home')}
              className="group px-8 py-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-white/10 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div className="bg-white rounded-sm opacity-80"></div>
                    <div className="bg-white rounded-sm opacity-60"></div>
                    <div className="bg-white rounded-sm opacity-60"></div>
                    <div className="bg-white rounded-sm opacity-90"></div>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-lg">全局多维度审核系统</div>
                  <div className="text-gray-400 text-sm">智能评估项目功能完善可用度</div>
                </div>
                <Zap className="w-5 h-5 text-yellow-400 group-hover:animate-pulse" />
              </div>
            </div>
          </div>

          {/* 交互提示 */}
          <div className="mt-8 text-center text-gray-400 text-sm space-y-2">
            <div className="flex items-center justify-center space-x-6">
              <span>🗣️ 语音: 直接说话</span>
              <span>👆 手势: 上滑搜索</span>
              <span>👀 注视: 中心区域2秒</span>
            </div>
            <div className="flex items-center justify-center space-x-6">
              <span>➡️ 右滑: 执行建议</span>
              <span>⬅️ 左滑: 清空内容</span>
              <span>⬇️ 下滑: 查看历史</span>
            </div>
          </div>
        </div>

        {/* 智能状态指示器 */}
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
          {isGazing && (
            <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-3 border border-green-400/30">
              <Eye className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
          )}
          {userIntent && (
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-3 border border-purple-400/30">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
