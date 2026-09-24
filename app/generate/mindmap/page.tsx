"use client"

import type React from "react"

import { Brain, Download, Eye, Hand, Mic, Share2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { GeneratorPageShell, ToolbarButton } from "@/components/templates/generator-page-shell"

interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  level: number
  children: string[]
  parent?: string
  color: string
}

export default function MindMapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "pan" | "zoom">("idle")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 生成思维导图数据
  useEffect(() => {
    const generateMindMap = async () => {
      setIsGenerating(true)

      // 模拟AI生成过程
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const centerNode: MindMapNode = {
        id: "center",
        text: query,
        x: 400,
        y: 300,
        level: 0,
        children: ["concept1", "concept2", "concept3", "concept4"],
        color: "#8B5CF6",
      }

      const childNodes: MindMapNode[] = [
        {
          id: "concept1",
          text: "核心概念",
          x: 200,
          y: 200,
          level: 1,
          children: ["detail1", "detail2"],
          parent: "center",
          color: "#3B82F6",
        },
        {
          id: "concept2",
          text: "实践应用",
          x: 600,
          y: 200,
          level: 1,
          children: ["detail3", "detail4"],
          parent: "center",
          color: "#10B981",
        },
        {
          id: "concept3",
          text: "发展趋势",
          x: 200,
          y: 400,
          level: 1,
          children: ["detail5"],
          parent: "center",
          color: "#F59E0B",
        },
        {
          id: "concept4",
          text: "学习路径",
          x: 600,
          y: 400,
          level: 1,
          children: ["detail6"],
          parent: "center",
          color: "#EF4444",
        },
        // 详细节点
        {
          id: "detail1",
          text: "理论基础",
          x: 100,
          y: 150,
          level: 2,
          children: [],
          parent: "concept1",
          color: "#3B82F6",
        },
        {
          id: "detail2",
          text: "关键要素",
          x: 100,
          y: 250,
          level: 2,
          children: [],
          parent: "concept1",
          color: "#3B82F6",
        },
        {
          id: "detail3",
          text: "应用场景",
          x: 700,
          y: 150,
          level: 2,
          children: [],
          parent: "concept2",
          color: "#10B981",
        },
        {
          id: "detail4",
          text: "成功案例",
          x: 700,
          y: 250,
          level: 2,
          children: [],
          parent: "concept2",
          color: "#10B981",
        },
        {
          id: "detail5",
          text: "未来方向",
          x: 100,
          y: 450,
          level: 2,
          children: [],
          parent: "concept3",
          color: "#F59E0B",
        },
        {
          id: "detail6",
          text: "学习建议",
          x: 700,
          y: 450,
          level: 2,
          children: [],
          parent: "concept4",
          color: "#EF4444",
        },
      ]

      setNodes([centerNode, ...childNodes])
      setIsGenerating(false)
    }

    if (query) {
      generateMindMap()
    }
  }, [query])

  // 手势控制系统
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0
    let startDistance = 0
    let isPointerDown = false
    let pointers: PointerEvent[] = []

    const handlePointerDown = (e: PointerEvent) => {
      pointers.push(e)

      if (pointers.length === 1) {
        isPointerDown = true
        startX = e.clientX
        startY = e.clientY
        setGestureMode("pan")
      } else if (pointers.length === 2) {
        const p0 = pointers[0]
        const p1 = pointers[1]
        if (!p0 || !p1) return
        const dx = p0.clientX - p1.clientX
        const dy = p0.clientY - p1.clientY
        startDistance = Math.sqrt(dx * dx + dy * dy)
        setGestureMode("zoom")
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const index = pointers.findIndex((p) => p.pointerId === e.pointerId)
      if (index !== -1) {
        pointers[index] = e
      }

      if (pointers.length === 1 && isPointerDown) {
        // 平移
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY

        setOffset((prev) => ({
          x: prev.x + deltaX * 0.5,
          y: prev.y + deltaY * 0.5,
        }))

        startX = e.clientX
        startY = e.clientY
      } else if (pointers.length === 2) {
        // 缩放
        const p0 = pointers[0]
        const p1 = pointers[1]
        if (!p0 || !p1) return
        const dx = p0.clientX - p1.clientX
        const dy = p0.clientY - p1.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const scaleChange = distance / startDistance
        setScale((prev) => Math.max(0.5, Math.min(3, prev * scaleChange)))
        startDistance = distance
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      pointers = pointers.filter((p) => p.pointerId !== e.pointerId)

      if (pointers.length === 0) {
        isPointerDown = false
        setTimeout(() => setGestureMode("idle"), 300)
      }
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

        if (command.includes("放大")) {
          setScale((prev) => Math.min(3, prev * 1.2))
        } else if (command.includes("缩小")) {
          setScale((prev) => Math.max(0.5, prev * 0.8))
        } else if (command.includes("重置")) {
          setScale(1)
          setOffset({ x: 0, y: 0 })
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
  }, [router])

  // 绘制思维导图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // 清空画布
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    // 应用变换
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // 绘制连接线
    nodes.forEach((node) => {
      if (node.parent) {
        const parent = nodes.find((n) => n.id === node.parent)
        if (parent) {
          ctx.beginPath()
          ctx.moveTo(parent.x, parent.y)
          ctx.lineTo(node.x, node.y)
          ctx.strokeStyle = node.color + "40"
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    })

    // 绘制节点
    nodes.forEach((node) => {
      const isSelected = selectedNode === node.id
      const radius = node.level === 0 ? 60 : node.level === 1 ? 40 : 30

      // 绘制节点背景
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = node.color + (isSelected ? "FF" : "80")
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // 绘制文本
      ctx.fillStyle = "#FFFFFF"
      ctx.font = `${node.level === 0 ? 16 : node.level === 1 ? 14 : 12}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // 文本换行
      const words = node.text.split("")
      const maxWidth = radius * 1.5
      let line = ""
      let y = node.y

      for (let i = 0; i < words.length; i++) {
        const word = words[i] ?? ""
        const testLine = line + word
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, node.x, y)
          line = word
          y += 16
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, node.x, y)
    })

    ctx.restore()
  }, [nodes, selectedNode, scale, offset])

  // 节点点击处理
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale

    // 查找点击的节点
    const clickedNode = nodes.find((node) => {
      const radius = node.level === 0 ? 60 : node.level === 1 ? 40 : 30
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= radius
    })

    if (clickedNode) {
      setSelectedNode(clickedNode.id)
      if ("vibrate" in navigator) {
        navigator.vibrate(100)
      }
    } else {
      setSelectedNode(null)
    }
  }

  if (isGenerating) {
    return (
      <GeneratorPageShell
        icon={Brain}
        accent="purple"
        loadingTitle="AI正在生成思维导图"
        loadingSteps={["分析概念结构中...", "构建知识关联..."]}
        isGenerating
        title=""
      >
        <span />
      </GeneratorPageShell>
    )
  }

  return (
    <GeneratorPageShell
      icon={Brain}
      accent="purple"
      loadingTitle=""
      loadingSteps={[]}
      isGenerating={false}
      title={`${query} - 思维导图`}
      containerRef={containerRef}
      actions={
        <>
          <ToolbarButton title="下载">
            <Download className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton title="分享">
            <Share2 className="w-5 h-5" />
          </ToolbarButton>
        </>
      }
    >
      {/* 思维导图画布 */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        style={{ top: "80px", height: "calc(100vh - 80px)" }}
      />

      {/* 缩放控制 */}
      <div className="absolute bottom-8 left-8 flex flex-col space-y-2">
        <button
          onClick={() => setScale((prev) => Math.min(3, prev * 1.2))}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          +
        </button>
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-sm">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev * 0.8))}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          -
        </button>
      </div>

      {/* 状态指示器 */}
      <div className="absolute bottom-8 right-8 flex flex-col space-y-2">
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
        {selectedNode && (
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-3 border border-purple-400/30">
            <Eye className="w-5 h-5 text-purple-400" />
          </div>
        )}
      </div>

      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="absolute top-24 right-8 w-80 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4">{nodes.find((n) => n.id === selectedNode)?.text}</h3>
          <p className="text-gray-300 text-sm mb-4">
            这是关于&quot;{nodes.find((n) => n.id === selectedNode)?.text}&quot;的详细说明和相关信息。
          </p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors">
              展开详情
            </button>
            <button className="px-4 py-2 bg-blue-500/20 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30 transition-colors">
              添加子节点
            </button>
          </div>
        </div>
      )}

      {/* 交互提示 */}
      <div className="absolute top-24 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>🖱️ 拖拽: 移动视图</p>
          <p>🤏 双指: 缩放</p>
          <p>🗣️ 语音: &quot;放大&quot;、&quot;缩小&quot;、&quot;重置&quot;</p>
          <p>👆 点击: 选择节点</p>
        </div>
      </div>
    </GeneratorPageShell>
  )
}
