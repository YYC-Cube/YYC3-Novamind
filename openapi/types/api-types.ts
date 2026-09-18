/**
 * API 契约 TS 类型定义（next-openapi-gen 扫描源）
 *
 * 说明：
 * - next-openapi-gen 1.x 仅解析 schemaDir 内的纯 TS 类型（type / interface / enum）
 * - 本文件是 JSDoc @body / @response / @params 注解的解析目标
 * - 字段行尾注释会自动映射为 OpenAPI description
 * - 运行时校验使用 openapi/schemas.ts 中的 Zod schema（单一事实源分离：
 *   类型契约在此，校验规则在 schemas.ts，两者字段保持同步）
 */

// ============ 通用 ============

/** 业务错误结构 */
interface ApiErrorInfo {
  /** 错误类型标识 */
  type: string
  /** 用户可读错误信息 */
  message: string
  /** 错误唯一 ID（链路追踪） */
  id?: string
  /** 调试详情 */
  details?: string
}

/** 标准业务响应包裹 */
interface ApiEnvelope {
  /** 是否成功 */
  success: boolean
  /** 业务数据负载 */
  data?: any
  /** 附加消息 */
  message?: string
  /** 失败时的错误结构 */
  error?: ApiErrorInfo | string
}

// ============ 查询参数（@query 契约） ============

/** GET /api/auth 查询参数 */
interface AuthQuery {
  /** current_user / verify_email */
  action: string
  /** verify_email 时必填 */
  token?: string
}

/** GET /api/ai 查询参数 */
interface AIQuery {
  /** status / providers / current_provider / test_provider / health */
  action: string
  /** test_provider 时必填 */
  provider?: string
}

/** GET /api/database 查询参数 */
interface DatabaseQuery {
  /** health / connections / history / search_history / favorites / conversations */
  action: string
  /** 可选用户过滤 */
  userId?: string
  /** search_history 时必填 */
  query?: string
  /** history 分页，默认 50 */
  limit?: number
}

/** GET /api/performance 查询参数 */
interface PerformanceQuery {
  /** report / memory / operation_stats / cache_stats */
  action: string
  /** operation_stats 时必填 */
  operation?: string
}

/** GET /api/sync 查询参数 */
interface SyncQuery {
  /** 设备 ID，默认 default */
  deviceId?: string
  /** 增量同步起点 ISO 时间 */
  lastSync?: string
  /** search_history / favorites / settings / user_data */
  type?: SyncDataType
}

/** PUT /api/sync 查询参数 */
interface SyncActionQuery {
  /** 设备 ID */
  deviceId?: string
  /** resolve_conflict / force_sync */
  action?: string
}

/** DELETE /api/sync 查询参数 */
interface SyncDeleteQuery {
  /** 设备 ID */
  deviceId?: string
  /** 可选，数据类型 */
  type?: SyncDataType
}

/** DELETE /api/database 查询参数 */
interface DatabaseDeleteQuery {
  /** favorite / connection */
  action: string
  /** 目标 ID，必填 */
  id: string
  /** 可选用户过滤 */
  userId?: string
}

// ============ /api/ai ============

/** 对话消息角色 */
enum ChatRole {
  /** 系统提示 */
  system,
  /** 用户输入 */
  user,
  /** 助手回复 */
  assistant,
}

/** 单条对话消息 */
interface ChatMessage {
  /** 消息角色 */
  role: ChatRole
  /** 消息内容（1-32000 字符） */
  content: string
}

/** POST /api/chat 请求体 */
interface ChatRequest {
  /** 对话消息列表（1-50 条） */
  messages: ChatMessage[]
  /** 模型名称 */
  model?: string
  /** 采样温度 0-2 */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** 是否流式返回 */
  stream?: boolean
}

/** token 用量统计 */
interface ChatUsage {
  /** 提示词 token 数 */
  prompt_tokens: number
  /** 生成 token 数 */
  completion_tokens: number
  /** 总 token 数 */
  total_tokens: number
}

/** POST /api/chat 响应体 */
interface ChatResponse {
  /** 响应唯一 ID */
  id: string
  /** OpenAI 兼容 choices 结构 */
  choices: Array<{
    /** 助手回复消息 */
    message: ChatMessage
    /** 结束原因 */
    finish_reason: string
  }>
  /** token 用量 */
  usage: ChatUsage
  /** 服务端元数据 */
  metadata: {
    /** 服务端处理耗时 ms */
    responseTime: number
    /** 实际使用的模型 */
    model: string
    /** 服务端时间戳 */
    timestamp: number
  }
}

/** GET /api/chat 响应体 */
interface ChatHealthResponse {
  /** 服务状态 */
  status: string
  /** 状态说明 */
  message: string
  /** ISO 时间戳 */
  timestamp: string
}

/** GET /api/ai?action=status 响应 */
interface AIStatusResponse extends ApiEnvelope {
  /** AI 服务状态 */
  data: {
    /** 当前活跃提供商 */
    activeProvider: string
    /** 各提供商可用性 */
    providers: Record<string, { available: boolean; latency?: number }>
  }
}

/** GET /api/ai?action=providers 响应 */
interface AIProvidersResponse extends ApiEnvelope {
  /** 可用提供商列表 */
  data: string[]
}

/** GET /api/ai?action=health 响应 */
interface AIHealthResponse extends ApiEnvelope {
  data: {
    /** healthy | unhealthy */
    status: string
    /** 活跃提供商 */
    activeProvider: string
    /** 可用提供商名 */
    availableProviders: string[]
  }
}

/** POST /api/ai 请求体（action 分发） */
interface AIRequest {
  /** 动作：chat | stream_chat | switch_provider | select_best_provider | batch_process */
  action: string
  /** 动作数据负载 */
  data?: {
    /** 对话消息列表（chat / stream_chat） */
    messages?: ChatMessage[]
    /** 目标提供商（switch_provider） */
    provider?: string
    /** 采样温度 */
    temperature?: number
    /** 最大 token */
    maxTokens?: number
    /** 模型名称 */
    model?: string
    /** 批处理项目（batch_process） */
    items?: Array<{ content: string }>
    /** 批处理器类型：summarize | translate | analyze */
    processorType?: string
  }
  /** 扩展选项 */
  options?: Record<string, any>
}

/** POST /api/ai 响应体 */
interface AIResponse extends ApiEnvelope {
  /** 元数据（处理耗时 / 实际提供商） */
  metadata?: {
    /** 处理耗时 ms */
    processingTime: number
    /** 使用的提供商 */
    provider: string
  }
}

/** PUT /api/ai 请求体 */
interface AIConfigUpdate {
  /** 动作：optimize_performance | clear_cache | update_config */
  action: string
  data?: {
    /** 提供商名称 */
    provider?: string
    /** 配置对象 */
    config?: Record<string, any>
  }
}

// ============ /api/chat/stream ============

/** POST /api/chat/stream 请求体 */
interface StreamChatRequest {
  /** 对话消息列表 */
  messages: ChatMessage[]
  /** 模型名称 */
  model?: string
  /** 采样温度 */
  temperature?: number
  /** 最大 token（snake_case 兼容） */
  max_tokens?: number
  /** 流式标记（恒为 true） */
  stream: boolean
}

// ============ /api/auth ============

/** POST /api/auth 请求体（action 分发） */
interface AuthRequest {
  /** 动作：login | register | wechat_login | refresh_token | reset_password | change_password | logout */
  action: string
  /** 邮箱 */
  email?: string
  /** 用户名 */
  username?: string
  /** 密码 */
  password?: string
  /** 确认密码（register） */
  confirmPassword?: string
  /** 记住我（login） */
  rememberMe?: boolean
  /** 同意条款（register） */
  acceptTerms?: boolean
  /** 邀请码（register） */
  inviteCode?: string
  /** 微信 code（wechat_login） */
  code?: string
  /** 微信 state（wechat_login） */
  state?: string
  /** 旧密码（change_password） */
  oldPassword?: string
  /** 新密码（change_password） */
  newPassword?: string
}

/** POST /api/auth 响应体 */
interface AuthResponse extends ApiEnvelope {
  /** 访问令牌（login / wechat_login 成功时） */
  accessToken?: string
  /** 刷新令牌 */
  refreshToken?: string
  /** 用户信息 */
  user?: {
    /** 用户 ID */
    id: string
    /** 邮箱 */
    email: string
    /** 用户名 */
    username: string
  }
}

/** PUT /api/auth 请求体 */
interface AuthUpdate {
  /** 动作：update_profile */
  action: string
  /** 待更新的用户字段 */
  updates?: Record<string, any>
}

// ============ /api/upload ============

/** POST /api/upload 响应体 */
interface UploadResponse extends ApiEnvelope {
  data?: {
    /** 上传记录 ID */
    id: string
    /** 存储文件名 */
    filename: string
    /** 原始文件名 */
    originalName: string
    /** MIME 类型 */
    type: string
    /** 文件大小 bytes */
    size: number
    /** 提取的文本内容 */
    extractedText: string
    /** 分析摘要 */
    analysis: string
    /** ISO 上传时间 */
    uploadedAt: string
  }
}

/** GET /api/upload 响应体 */
interface UploadInfoResponse {
  /** 服务状态 */
  status: string
  /** 状态说明 */
  message: string
  /** 支持的 MIME 列表 */
  supportedTypes: string[]
  /** 大小上限描述 */
  maxSize: string
}

// ============ /api/analyze-image ============

/** POST /api/analyze-image 响应体 */
interface ImageAnalyzeResponse extends ApiEnvelope {
  data?: {
    /** AI 分析文本 */
    analysis: string
    /** 图片元信息 */
    imageInfo: {
      /** 文件名 */
      filename: string
      /** MIME 类型 */
      type: string
      /** 大小 bytes */
      size: number
      /** 尺寸描述 */
      dimensions?: string
    }
    /** ISO 处理时间 */
    processedAt: string
  }
}

/** GET /api/analyze-image 响应体 */
interface ImageAnalyzeInfoResponse {
  status: string
  message: string
  /** 支持的图片格式 */
  supportedFormats: string[]
  /** 大小上限 */
  maxSize: string
  /** 功能列表 */
  features: string[]
}

// ============ /api/speech-to-text ============

/** POST /api/speech-to-text 响应体 */
interface SpeechToTextResponse extends ApiEnvelope {
  data?: {
    /** 识别文本 */
    text: string
    /** 置信度 0-1 */
    confidence: number
    /** 语言代码 */
    language: string
    /** 估算时长秒 */
    duration: number
    /** ISO 处理时间 */
    processedAt: string
  }
}

/** GET /api/speech-to-text 响应体 */
interface SpeechToTextInfoResponse {
  status: string
  message: string
  /** 支持的音频格式 */
  supportedFormats: string[]
  /** 大小上限 */
  maxSize: string
  /** 支持语言 */
  languages: string[]
}

// ============ /api/status ============

/** 服务健康状态 */
enum ServiceStatusEnum {
  /** 正常 */
  healthy,
  /** 降级 */
  degraded,
  /** 宕机 */
  down,
}

/** GET /api/status 响应体 */
interface SystemStatusResponse {
  /** 总体状态 */
  status: string
  /** ISO 时间戳 */
  timestamp: string
  /** 本次检查耗时 ms */
  responseTime: number
  /** 各服务状态映射 */
  services: Record<
    string,
    {
      /** 单服务状态 */
      status: string
      /** 响应耗时 ms */
      responseTime: number
      /** ISO 最近检查 */
      lastCheck: string
      /** 详情 */
      details?: string
    }
  >
  /** 系统指标 */
  system: {
    /** 进程运行秒数 */
    uptime: number
    /** 内存使用 */
    memory: Record<string, number>
    /** CPU 信息 */
    cpu: {
      /** 使用率 % */
      usage: number
      /** 核心数 */
      cores: number
    }
    /** Node 版本 */
    version: string
    /** 平台 */
    platform: string
  }
  /** 汇总 */
  summary: {
    /** 服务总数 */
    totalServices: number
    /** 健康数 */
    healthyServices: number
    /** 降级数 */
    degradedServices: number
    /** 宕机数 */
    downServices: number
    /** 平均响应 ms */
    averageResponseTime: number
  }
  /** 端点地图 */
  endpoints: Record<string, string>
}

// ============ /api/sync ============

/** 同步数据类型 */
enum SyncDataType {
  /** 搜索历史 */
  search_history,
  /** 收藏 */
  favorites,
  /** 设置 */
  settings,
  /** 用户数据 */
  user_data,
}

/** POST /api/sync 请求体 */
interface SyncRequest {
  /** 数据类型 */
  type: SyncDataType
  /** 同步负载 */
  data: Record<string, any>
  /** ISO 客户端时间戳 */
  timestamp: string
  /** 设备 ID */
  deviceId: string
}

/** /api/sync 标准响应体 */
interface SyncResponse {
  /** 是否成功 */
  success: boolean
  /** 同步条数 */
  synced: number
  /** 冲突数 */
  conflicts: number
  /** ISO 最近同步 */
  lastSync: string
  /** 服务端数据（GET） */
  data?: Record<string, any>
  /** 错误信息 */
  error?: string
}

// ============ /api/performance ============

/** GET /api/performance 响应（action 分发） */
interface PerformanceReportResponse extends ApiEnvelope {
  data?: {
    /** 缓存统计 */
    cacheStats?: Record<string, any>
    /** 内存用量 */
    memoryUsage?: Record<string, number>
    /** 操作统计 */
    operationStats?: Record<string, any>
  }
}

/** POST /api/performance 请求体 */
interface PerformanceActionRequest {
  /** 动作：optimize | clear_cache | process_file | batch_optimize_images | preload_resources */
  action: string
  data?: {
    /** 文件信息（process_file） */
    file?: { size?: number }
    /** 图片列表（batch_optimize_images） */
    images?: Array<{ id?: string | number; size?: number }>
    /** 优化选项 */
    optimizeOptions?: { format?: string }
    /** 预加载 URL 列表（preload_resources） */
    urls?: string[]
  }
}

// ============ /api/database ============

/** GET /api/database 响应（action 分发） */
interface DatabaseQueryResponse extends ApiEnvelope {
  data?: any
}

/** POST /api/database 请求体 */
interface DatabaseActionRequest {
  /** 动作：connect | switch | close | save_history | save_favorite | delete_favorite | save_conversation | update_conversation | query | transaction */
  action: string
  data?: {
    /** 配置名（connect） */
    configName?: string
    /** 连接 ID（switch / close） */
    connectionId?: string
    /** 问题（save_history） */
    question?: string
    /** 答案（save_history） */
    answer?: string
    /** 分类 */
    category?: string
    /** 标签 */
    tags?: string[]
    /** 标题（save_favorite / save_conversation） */
    title?: string
    /** 内容（save_favorite） */
    content?: string
    /** 收藏类型 */
    type?: string
    /** 收藏 ID（delete_favorite） */
    id?: number | string
    /** 用户 ID */
    userId?: string
    /** 消息列表（save_conversation） */
    messages?: ChatMessage[]
    /** 更新负载 */
    updates?: Record<string, any>
    /** SQL（query） */
    sql?: string
    /** SQL 参数 */
    params?: any[]
    /** 事务操作列表（transaction） */
    operations?: Array<{ sql: string; params?: any[] }>
  }
}

/** DELETE /api/database 请求（query 参数风格） */
interface DatabaseDeleteParams {
  /** 动作：favorite | connection */
  action: string
  /** 目标 ID */
  id: string
  /** 用户 ID */
  userId?: string
}

// ============ /api/test-offline ============

/** POST /api/test-offline 请求体 */
interface OfflineProcessRequest {
  /** 查询内容 */
  query?: string
}

/** GET /api/test-offline 响应体 */
interface OfflineTestResponse {
  /** 提示消息 */
  message: string
  /** 是否离线 */
  offline: boolean
  /** ISO 时间戳 */
  timestamp: string
  data?: {
    /** 搜索结果 */
    searchResults: Array<{
      /** 结果 ID */
      id: string
      /** 标题 */
      title: string
      /** 描述 */
      description: string
      /** 链接 */
      url: string
      /** 类型 */
      type: string
      /** 相关度 0-1 */
      relevance: number
      /** ISO 时间戳 */
      timestamp: string
    }>
    /** 建议词 */
    suggestions: string[]
    /** 统计 */
    stats: {
      /** 总结果数 */
      totalResults: number
      /** 搜索耗时秒 */
      searchTime: number
      /** 来源列表 */
      sources: string[]
    }
  }
}
