"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"

// 插件接口定义
export interface Plugin {
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
  config?: Record<string, any>
  hooks?: {
    onInstall?: () => Promise<void>
    onUninstall?: () => Promise<void>
    onActivate?: () => Promise<void>
    onDeactivate?: () => Promise<void>
    onConfigChange?: (config: Record<string, any>) => Promise<void>
  }
}

export interface PluginCategory {
  id: string
  name: string
  count: number
  icon: any
}

export interface PluginInstallation {
  id: string
  pluginId: string
  status: "pending" | "downloading" | "installing" | "completed" | "failed"
  progress: number
  error?: string
  startedAt: Date
  completedAt?: Date
}

// 插件管理器Hook
export function usePluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set())
  const [installations, setInstallations] = useState<Map<string, PluginInstallation>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载插件数据
  const loadPlugins = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
          status: "inactive",
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
      ]

      setPlugins(mockPlugins)

      // 模拟已安装插件
      const installed = new Set(["ai-translator"])
      setInstalledPlugins(installed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载插件失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 安装插件
  const installPlugin = useCallback(
    async (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) {
        throw new Error("插件不存在")
      }

      // 创建安装记录
      const installation: PluginInstallation = {
        id: `install_${Date.now()}`,
        pluginId,
        status: "pending",
        progress: 0,
        startedAt: new Date(),
      }

      setInstallations((prev) => new Map(prev).set(pluginId, installation))

      try {
        // 更新插件状态
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: "installing" } : p)))

        // 模拟安装过程
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200))

          setInstallations((prev) => {
            const newMap = new Map(prev)
            const current = newMap.get(pluginId)
            if (current) {
              newMap.set(pluginId, {
                ...current,
                progress,
                status: progress === 100 ? "completed" : "installing",
              })
            }
            return newMap
          })
        }

        // 执行插件安装钩子
        if (plugin.hooks?.onInstall) {
          await plugin.hooks.onInstall()
        }

        // 更新状态
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: "active" } : p)))

        setInstalledPlugins((prev) => new Set([...prev, pluginId]))

        // 完成安装
        setInstallations((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(pluginId)
          if (current) {
            newMap.set(pluginId, {
              ...current,
              status: "completed",
              completedAt: new Date(),
            })
          }
          return newMap
        })
      } catch (err) {
        // 安装失败
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: "error" } : p)))

        setInstallations((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(pluginId)
          if (current) {
            newMap.set(pluginId, {
              ...current,
              status: "failed",
              error: err instanceof Error ? err.message : "安装失败",
            })
          }
          return newMap
        })

        throw err
      }
    },
    [plugins],
  )

  // 卸载插件
  const uninstallPlugin = useCallback(
    async (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) {
        throw new Error("插件不存在")
      }

      try {
        // 执行插件卸载钩子
        if (plugin.hooks?.onUninstall) {
          await plugin.hooks.onUninstall()
        }

        // 更新状态
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: "inactive" } : p)))

        setInstalledPlugins((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pluginId)
          return newSet
        })

        // 清理安装记录
        setInstallations((prev) => {
          const newMap = new Map(prev)
          newMap.delete(pluginId)
          return newMap
        })
      } catch (err) {
        throw new Error(`卸载插件失败: ${err instanceof Error ? err.message : "未知错误"}`)
      }
    },
    [plugins],
  )

  // 切换插件状态
  const togglePlugin = useCallback(
    async (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin || !installedPlugins.has(pluginId)) {
        throw new Error("插件未安装")
      }

      const newStatus = plugin.status === "active" ? "inactive" : "active"

      try {
        // 执行相应的钩子
        if (newStatus === "active" && plugin.hooks?.onActivate) {
          await plugin.hooks.onActivate()
        } else if (newStatus === "inactive" && plugin.hooks?.onDeactivate) {
          await plugin.hooks.onDeactivate()
        }

        // 更新状态
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, status: newStatus } : p)))
      } catch (err) {
        throw new Error(`切换插件状态失败: ${err instanceof Error ? err.message : "未知错误"}`)
      }
    },
    [plugins, installedPlugins],
  )

  // 更新插件配置
  const updatePluginConfig = useCallback(
    async (pluginId: string, config: Record<string, any>) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin || !installedPlugins.has(pluginId)) {
        throw new Error("插件未安装")
      }

      try {
        // 执行配置变更钩子
        if (plugin.hooks?.onConfigChange) {
          await plugin.hooks.onConfigChange(config)
        }

        // 更新配置
        setPlugins((prev) => prev.map((p) => (p.id === pluginId ? { ...p, config: { ...p.config, ...config } } : p)))
      } catch (err) {
        throw new Error(`更新插件配置失败: ${err instanceof Error ? err.message : "未知错误"}`)
      }
    },
    [plugins, installedPlugins],
  )

  // 获取插件配置
  const getPluginConfig = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      return plugin?.config || {}
    },
    [plugins],
  )

  // 获取安装进度
  const getInstallationProgress = useCallback(
    (pluginId: string) => {
      return installations.get(pluginId)
    },
    [installations],
  )

  // 搜索插件
  const searchPlugins = useCallback(
    (query: string, category?: string) => {
      return plugins.filter((plugin) => {
        const matchesQuery =
          !query ||
          plugin.name.toLowerCase().includes(query.toLowerCase()) ||
          plugin.description.toLowerCase().includes(query.toLowerCase()) ||
          plugin.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))

        const matchesCategory = !category || category === "all" || plugin.category === category

        return matchesQuery && matchesCategory
      })
    },
    [plugins],
  )

  // 获取推荐插件
  const getFeaturedPlugins = useCallback(() => {
    return plugins.filter((plugin) => plugin.featured)
  }, [plugins])

  // 获取已安装插件
  const getInstalledPlugins = useCallback(() => {
    return plugins.filter((plugin) => installedPlugins.has(plugin.id))
  }, [plugins, installedPlugins])

  // 初始化
  useEffect(() => {
    loadPlugins()
  }, [loadPlugins])

  return {
    // 状态
    plugins,
    installedPlugins,
    installations,
    loading,
    error,

    // 操作方法
    loadPlugins,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    updatePluginConfig,
    getPluginConfig,
    getInstallationProgress,

    // 查询方法
    searchPlugins,
    getFeaturedPlugins,
    getInstalledPlugins,
  }
}

// 插件上下文
interface PluginContextType {
  plugins: Plugin[]
  installedPlugins: Set<string>
  loading: boolean
  error: string | null
  installPlugin: (pluginId: string) => Promise<void>
  uninstallPlugin: (pluginId: string) => Promise<void>
  togglePlugin: (pluginId: string) => Promise<void>
  updatePluginConfig: (pluginId: string, config: Record<string, any>) => Promise<void>
  getPluginConfig: (pluginId: string) => Record<string, any>
}

const PluginContext = createContext<PluginContextType | null>(null)

// 插件提供者组件
export function PluginProvider({ children }: { children: ReactNode }) {
  const pluginManager = usePluginManager()

  return <PluginContext.Provider value={pluginManager}>{children}</PluginContext.Provider>
}

// 使用插件上下文的Hook
export function usePlugins() {
  const context = useContext(PluginContext)
  if (!context) {
    throw new Error("usePlugins must be used within a PluginProvider")
  }
  return context
}

// 插件工具函数
export const PluginUtils = {
  // 验证插件兼容性
  isCompatible: (plugin: Plugin, userAgent: string): boolean => {
    if (!plugin.compatibility || plugin.compatibility.length === 0) {
      return true
    }

    return plugin.compatibility.some((browser) => userAgent.toLowerCase().includes(browser.toLowerCase()))
  },

  // 格式化插件大小
  formatSize: (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB)$/i)
    if (!match) return 0

    const size = Number.parseFloat(match[1] ?? "0")
    const unit = (match[2] ?? "").toUpperCase()

    switch (unit) {
      case "KB":
        return size * 1024
      case "MB":
        return size * 1024 * 1024
      case "GB":
        return size * 1024 * 1024 * 1024
      default:
        return size
    }
  },

  // 检查权限
  hasPermission: (plugin: Plugin, permission: string): boolean => {
    return plugin.permissions.includes(permission)
  },

  // 获取插件评分星级
  getStarRating: (rating: number): string => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return "★".repeat(fullStars) + (hasHalfStar ? "☆" : "") + "☆".repeat(emptyStars)
  },

  // 验证插件版本
  compareVersions: (version1: string, version2: string): number => {
    const v1Parts = version1.split(".").map(Number)
    const v2Parts = version2.split(".").map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  },
}
