"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Download,
  Star,
  Shield,
  Zap,
  Code,
  Brain,
  Camera,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  status: "active" | "inactive" | "installing" | "error"
  rating: number
  downloads: number
  price: number
  icon: string
  screenshots: string[]
  permissions: string[]
  size: string
  lastUpdated: string
  compatibility: string[]
  tags: string[]
  featured: boolean
}

interface PluginCategory {
  id: string
  name: string
  count: number
  icon: any
}

// 使用Hook替代类
function usePluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 模拟插件数据
  const mockPlugins: Plugin[] = [
    {
      id: "ai-translator",
      name: "AI智能翻译",
      version: "2.1.0",
      description: "支持100+语言的实时翻译插件，基于最新的神经网络翻译技术",
      author: "YanYu团队",
      category: "ai",
      status: "active",
      rating: 4.8,
      downloads: 15420,
      price: 0,
      icon: "🌐",
      screenshots: ["/screenshots/translator-1.jpg"],
      permissions: ["网络访问", "剪贴板读写"],
      size: "2.3MB",
      lastUpdated: "2024-01-10",
      compatibility: ["Chrome", "Firefox", "Safari"],
      tags: ["翻译", "AI", "多语言"],
      featured: true,
    },
    {
      id: "smart-summarizer",
      name: "智能摘要生成器",
      version: "1.5.2",
      description: "一键生成文章摘要，支持多种文档格式，提高阅读效率",
      author: "AI工具开发者",
      category: "productivity",
      status: "active",
      rating: 4.6,
      downloads: 8930,
      price: 9.99,
      icon: "📝",
      screenshots: ["/screenshots/summarizer-1.jpg"],
      permissions: ["文件读取", "网络访问"],
      size: "1.8MB",
      lastUpdated: "2024-01-08",
      compatibility: ["Chrome", "Edge"],
      tags: ["摘要", "文档", "效率"],
      featured: false,
    },
    {
      id: "voice-assistant",
      name: "语音助手",
      version: "3.0.1",
      description: "智能语音交互助手，支持语音命令和自然语言对话",
      author: "语音科技",
      category: "ai",
      status: "inactive",
      rating: 4.4,
      downloads: 12500,
      price: 19.99,
      icon: "🎤",
      screenshots: ["/screenshots/voice-1.jpg"],
      permissions: ["麦克风访问", "网络访问"],
      size: "5.2MB",
      lastUpdated: "2024-01-05",
      compatibility: ["Chrome", "Firefox"],
      tags: ["语音", "AI", "助手"],
      featured: true,
    },
    {
      id: "code-formatter",
      name: "代码格式化工具",
      version: "2.3.0",
      description: "支持多种编程语言的代码格式化和美化工具",
      author: "开发者工具",
      category: "development",
      status: "active",
      rating: 4.7,
      downloads: 6780,
      price: 0,
      icon: "💻",
      screenshots: ["/screenshots/formatter-1.jpg"],
      permissions: ["剪贴板读写"],
      size: "1.2MB",
      lastUpdated: "2024-01-12",
      compatibility: ["Chrome", "Firefox", "Safari", "Edge"],
      tags: ["代码", "格式化", "开发"],
      featured: false,
    },
    {
      id: "image-enhancer",
      name: "AI图像增强",
      version: "1.8.5",
      description: "使用AI技术增强图像质量，支持超分辨率和降噪",
      author: "图像处理专家",
      category: "media",
      status: "installing",
      rating: 4.9,
      downloads: 23400,
      price: 29.99,
      icon: "🖼️",
      screenshots: ["/screenshots/enhancer-1.jpg"],
      permissions: ["文件读写", "网络访问"],
      size: "8.7MB",
      lastUpdated: "2024-01-14",
      compatibility: ["Chrome", "Edge"],
      tags: ["图像", "AI", "增强"],
      featured: true,
    },
    {
      id: "password-manager",
      name: "安全密码管理器",
      version: "4.2.1",
      description: "安全存储和管理密码，支持自动填充和密码生成",
      author: "安全软件公司",
      category: "security",
      status: "active",
      rating: 4.5,
      downloads: 18900,
      price: 4.99,
      icon: "🔐",
      screenshots: ["/screenshots/password-1.jpg"],
      permissions: ["存储访问", "表单填充"],
      size: "3.1MB",
      lastUpdated: "2024-01-11",
      compatibility: ["Chrome", "Firefox", "Safari"],
      tags: ["安全", "密码", "管理"],
      featured: false,
    },
  ]

  const categories: PluginCategory[] = [
    { id: "all", name: "全部", count: mockPlugins.length, icon: Grid },
    { id: "ai", name: "AI工具", count: mockPlugins.filter((p) => p.category === "ai").length, icon: Brain },
    {
      id: "productivity",
      name: "生产力",
      count: mockPlugins.filter((p) => p.category === "productivity").length,
      icon: Zap,
    },
    {
      id: "development",
      name: "开发工具",
      count: mockPlugins.filter((p) => p.category === "development").length,
      icon: Code,
    },
    { id: "media", name: "媒体处理", count: mockPlugins.filter((p) => p.category === "media").length, icon: Camera },
    {
      id: "security",
      name: "安全工具",
      count: mockPlugins.filter((p) => p.category === "security").length,
      icon: Shield,
    },
  ]

  useEffect(() => {
    // 模拟加载插件数据
    const loadPlugins = async () => {
      setLoading(true)
      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setPlugins(mockPlugins)

        // 模拟已安装插件
        const installed = new Set(["ai-translator", "code-formatter", "password-manager"])
        setInstalledPlugins(installed)
      } catch (err) {
        setError("加载插件失败")
      } finally {
        setLoading(false)
      }
    }

    loadPlugins()
  }, [])

  const installPlugin = useCallback(async (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((plugin) => (plugin.id === pluginId ? { ...plugin, status: "installing" as const } : plugin)),
    )

    try {
      // 模拟安装过程
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setPlugins((prev) =>
        prev.map((plugin) => (plugin.id === pluginId ? { ...plugin, status: "active" as const } : plugin)),
      )

      setInstalledPlugins((prev) => new Set([...prev, pluginId]))
    } catch (err) {
      setPlugins((prev) =>
        prev.map((plugin) => (plugin.id === pluginId ? { ...plugin, status: "error" as const } : plugin)),
      )
    }
  }, [])

  const uninstallPlugin = useCallback(async (pluginId: string) => {
    try {
      setPlugins((prev) =>
        prev.map((plugin) => (plugin.id === pluginId ? { ...plugin, status: "inactive" as const } : plugin)),
      )

      setInstalledPlugins((prev) => {
        const newSet = new Set(prev)
        newSet.delete(pluginId)
        return newSet
      })
    } catch (err) {
      setError("卸载插件失败")
    }
  }, [])

  const togglePlugin = useCallback(
    async (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) return

      const newStatus = plugin.status === "active" ? "inactive" : "active"

      setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: newStatus } : p)))
    },
    [plugins],
  )

  return {
    plugins,
    categories,
    installedPlugins,
    loading,
    error,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
  }
}

export default function PluginsPage() {
  const { plugins, categories, installedPlugins, loading, error, installPlugin, uninstallPlugin, togglePlugin } =
    usePluginManager()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showInstalled, setShowInstalled] = useState(false)

  // 过滤和排序插件
  const filteredPlugins = useMemo(() => {
    const filtered = plugins.filter((plugin) => {
      const matchesSearch =
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "all" || plugin.category === selectedCategory

      const matchesInstalled = !showInstalled || installedPlugins.has(plugin.id)

      return matchesSearch && matchesCategory && matchesInstalled
    })

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "featured":
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return b.rating - a.rating
        case "rating":
          return b.rating - a.rating
        case "downloads":
          return b.downloads - a.downloads
        case "name":
          return a.name.localeCompare(b.name)
        case "updated":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [plugins, searchQuery, selectedCategory, sortBy, showInstalled, installedPlugins])

  const getStatusIcon = (status: Plugin["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "inactive":
        return <Clock className="w-4 h-4 text-gray-400" />
      case "installing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: Plugin["status"]) => {
    switch (status) {
      case "active":
        return "已启用"
      case "inactive":
        return "已禁用"
      case "installing":
        return "安装中..."
      case "error":
        return "错误"
      default:
        return "未知"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">正在加载插件...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">插件中心</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">扩展您的 YYC³ NovaMind 功能</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowInstalled(!showInstalled)}
                className={showInstalled ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
              >
                {showInstalled ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showInstalled ? "显示全部" : "仅已安装"}
              </Button>
              <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 侧边栏 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">分类</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <span>{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 主内容 */}
          <div className="flex-1">
            {/* 搜索和过滤 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="搜索插件..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">推荐优先</SelectItem>
                    <SelectItem value="rating">评分最高</SelectItem>
                    <SelectItem value="downloads">下载最多</SelectItem>
                    <SelectItem value="name">名称排序</SelectItem>
                    <SelectItem value="updated">最近更新</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 插件列表 */}
            {filteredPlugins.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">未找到匹配的插件</h3>
                <p className="text-gray-600 dark:text-gray-400">尝试调整搜索条件或浏览其他分类</p>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}
              >
                {filteredPlugins.map((plugin) => (
                  <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{plugin.icon}</div>
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                v{plugin.version}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(plugin.status)}
                                <span className="text-xs text-gray-500">{getStatusText(plugin.status)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {plugin.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">推荐</Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <CardDescription className="text-sm mb-4 line-clamp-2">{plugin.description}</CardDescription>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{plugin.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{plugin.downloads.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {plugin.price === 0 ? (
                            <span className="text-green-600 font-medium">免费</span>
                          ) : (
                            <span className="font-medium">¥{plugin.price}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {plugin.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <div>作者: {plugin.author}</div>
                          <div>大小: {plugin.size}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {installedPlugins.has(plugin.id) ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePlugin(plugin.id)}
                                disabled={plugin.status === "installing"}
                              >
                                {plugin.status === "active" ? "禁用" : "启用"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => uninstallPlugin(plugin.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => installPlugin(plugin.id)}
                              disabled={plugin.status === "installing"}
                            >
                              {plugin.status === "installing" ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  安装中
                                </>
                              ) : (
                                "安装"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
