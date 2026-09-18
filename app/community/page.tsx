"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Search,
  Plus,
  Star,
  BookOpen,
  Brain,
  Users,
  Award,
  Filter,
} from "lucide-react"

interface CommunityItem {
  id: string
  authorId: string
  authorName: string
  title: string
  content: string
  type: "search-result" | "learning-path" | "mindmap" | "conversation" | "knowledge-graph"
  tags: string[]
  createdAt: number
  likes: number
  views: number
  comments: number
}

// 模拟社区内容数据
const MOCK_CONTENT: CommunityItem[] = [
  {
    id: "content-1",
    authorId: "user-123",
    authorName: "张学霸",
    title: "高效学习方法分享：如何在30天内掌握新技能",
    content:
      "经过一年的实践和总结，我想分享一些真正有效的学习方法。核心原则：主动学习胜过被动接受、间隔重复是记忆之王、实践出真知。使用费曼学习法检验自己的理解，配合番茄工作法保持专注。",
    type: "conversation",
    tags: ["学习方法", "效率提升"],
    createdAt: Date.now() - 86400000 * 1,
    likes: 156,
    views: 1240,
    comments: 23,
  },
  {
    id: "content-2",
    authorId: "user-456",
    authorName: "学习达人",
    title: "React 19 新特性实战：从 Actions 到 use Hook",
    content:
      "React 19 带来了许多激动人心的新特性。本文通过实际项目案例，深入讲解 Actions、use Hook、Server Components 等核心概念的最佳实践。",
    type: "search-result",
    tags: ["React", "前端开发"],
    createdAt: Date.now() - 86400000 * 2,
    likes: 89,
    views: 654,
    comments: 12,
  },
  {
    id: "content-3",
    authorId: "user-789",
    authorName: "思维导图爱好者",
    title: "用思维导图构建个人知识体系",
    content:
      "知识体系不是一蹴而就的。通过思维导图工具，我们可以将碎片化的知识逐步结构化，形成互相连接的知识网络。分享我的三步法：收集、整理、关联。",
    type: "mindmap",
    tags: ["思维导图", "知识管理"],
    createdAt: Date.now() - 86400000 * 3,
    likes: 67,
    views: 432,
    comments: 8,
  },
  {
    id: "content-4",
    authorId: "user-101",
    authorName: "AI 探索者",
    title: "AI 辅助学习路径规划实践",
    content:
      "如何借助 AI 规划个性化学习路径？从目标设定、资源筛选到进度追踪，AI 可以在每个环节提供支持。本文分享一套完整的 AI 学习路径规划工作流。",
    type: "learning-path",
    tags: ["AI", "学习路径"],
    createdAt: Date.now() - 86400000 * 5,
    likes: 45,
    views: 321,
    comments: 6,
  },
]

const TYPE_LABELS: Record<CommunityItem["type"], string> = {
  "search-result": "搜索结果",
  "learning-path": "学习路径",
  mindmap: "思维导图",
  conversation: "对话",
  "knowledge-graph": "知识图谱",
}

export default function CommunityPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "following">("trending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [filteredContent, setFilteredContent] = useState<CommunityItem[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const loadContent = () => {
    let content = [...MOCK_CONTENT]

    switch (activeTab) {
      case "trending":
        content.sort((a, b) => b.likes - a.likes)
        break
      case "recent":
        content.sort((a, b) => b.createdAt - a.createdAt)
        break
      case "following":
        content = content.slice(0, 2)
        break
    }

    applyFilters(content)
  }

  const applyFilters = (content: CommunityItem[]) => {
    let filtered = [...content]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((c) => c.type === selectedType)
    }

    setFilteredContent(filtered)
  }

  useEffect(() => {
    loadContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    applyFilters(MOCK_CONTENT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedType])

  const handleLike = (contentId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(contentId)) {
        next.delete(contentId)
      } else {
        next.add(contentId)
      }
      return next
    })
  }

  const handleView = (contentId: string) => {
    router.push(`/community/content/${contentId}`)
  }

  const getTypeIcon = (type: CommunityItem["type"]) => {
    switch (type) {
      case "conversation":
        return <MessageCircle className="w-4 h-4" />
      case "search-result":
        return <BookOpen className="w-4 h-4" />
      case "mindmap":
        return <Brain className="w-4 h-4" />
      case "learning-path":
        return <Award className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString("zh-CN")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">学习社区</h1>
          </div>
          <button
            onClick={() => router.push("/community/share")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            分享内容
          </button>
        </div>

        {/* 标签页 */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { key: "trending", label: "热门", icon: TrendingUp },
              { key: "recent", label: "最新", icon: Clock },
              { key: "following", label: "关注", icon: Users },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">全部类型</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>

        {/* 内容列表 */}
        <div className="grid gap-6">
          {filteredContent.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
              <p className="text-gray-500 mb-4">成为第一个分享内容的人吧！</p>
              <button
                onClick={() => router.push("/community/share")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                分享内容
              </button>
            </div>
          ) : (
            filteredContent.map((content) => (
              <div key={content.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* 作者头像 */}
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium">{content.authorName.charAt(0)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 内容头部 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{content.authorName}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-sm text-gray-500">{formatTime(content.createdAt)}</span>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600`}>
                        {getTypeIcon(content.type)}
                        <span>{TYPE_LABELS[content.type]}</span>
                      </div>
                    </div>

                    {/* 内容标题和预览 */}
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => handleView(content.id)}
                    >
                      {content.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{content.content.slice(0, 200)}...</p>

                    {/* 标签 */}
                    {content.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {content.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 互动统计 */}
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(content.id)}
                        className={`flex items-center gap-1 hover:text-red-600 transition-colors ${
                          likedIds.has(content.id) ? "text-red-600" : ""
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedIds.has(content.id) ? "fill-current" : ""}`} />
                        <span>{content.likes + (likedIds.has(content.id) ? 1 : 0)}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{content.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{content.views}</span>
                      </div>
                      <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>分享</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 加载更多 */}
        {filteredContent.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              加载更多内容
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
