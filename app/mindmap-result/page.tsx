"use client"

import { MindMapManager, type MindMapData } from "@/lib/mindmap"
import { ArrowLeft, Download, Edit3, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function MindMapResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mindMapId = searchParams.get("id")

  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  useEffect(() => {
    if (mindMapId) {
      const mindMap = MindMapManager.getMindMapById(mindMapId)
      setMindMapData(mindMap)
      setLoading(false)
    }
  }, [mindMapId])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleResetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  const handleExport = () => {
    if (mindMapData) {
      const exportData = MindMapManager.exportMindMap(mindMapData.id)
      const blob = new Blob([exportData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mindmap_${mindMapData.title}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleEdit = () => {
    if (mindMapData) {
      router.push(`/generate/mindmap?id=${mindMapData.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">正在加载思维导图...</p>
        </div>
      </div>
    )
  }

  if (!mindMapData) {
    return (
      <div className="min-h-screen bg-surface-panel flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">思维导图不存在</h2>
          <p className="text-gray-400 mb-4">请检查链接是否正确</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-panel text-white">
      {/* 顶部工具栏 */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{mindMapData.title}</h1>
                <p className="text-sm text-gray-400">创建于 {new Date(mindMapData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-md" title="缩小">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-sm font-medium">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-md" title="放大">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={handleResetView} className="p-2 hover:bg-white/20 rounded-md" title="重置视图">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 思维导图显示区域 */}
      <div className="relative w-full h-screen overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: "center center",
          }}
        >
          <svg
            width="100%"
            height="100%"
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle, rgb(148 163 184 / 0.25) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* 渲染连接线 */}
            {mindMapData.connections.map((connection, index) => {
              const fromNode = mindMapData.nodes.find((n) => n.id === connection.from)
              const toNode = mindMapData.nodes.find((n) => n.id === connection.to)

              if (!fromNode || !toNode) return null

              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#64748b"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )
            })}
          </svg>

          {/* 渲染节点 */}
          {mindMapData.nodes.map((node) => (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: node.x,
                top: node.y,
              }}
            >
              <div
                className="px-4 py-3 rounded-xl shadow-lg border-2 min-w-[100px] text-center hover:shadow-xl transition-shadow duration-200"
                style={{
                  borderColor: node.color,
                  backgroundColor: node.color + "1a",
                }}
              >
                <div className="font-medium text-sm" style={{ color: node.color }}>
                  {node.text}
                </div>

                {node.level === 0 && <div className="mt-1 text-xs text-gray-400">主题</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="fixed bottom-4 left-4 bg-black/40 backdrop-blur-xl rounded-lg p-3 border border-white/10">
        <div className="text-sm text-gray-400">
          <div>节点数量: {mindMapData.nodes.length}</div>
          <div>连接数量: {mindMapData.connections.length}</div>
          <div>最后更新: {new Date(mindMapData.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
