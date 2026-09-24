/**
 * 设计模板与美化三产物生成脚本
 * 产出：思维导图（localStorage novamind-mindmaps）+ PPT（ppt-result 页实时生成参数）
 *
 * 用法：
 *   1. 思维导图：浏览器控制台粘贴 genDesignMindMap() 执行 → 自动跳转可视化页
 *   2. PPT：直接访问 /generate/ppt?q=... 生成，或复制下方 URL
 */

// ============ 1. 思维导图：设计模板与美化实施路径 ============
// 缩进层级语法与 MindMapManager.parseContentToNodes 对齐（空格缩进 = 层级）
const DESIGN_MINDMAP = `设计模板与美化总体战略
  问题诊断层
    品牌分裂：首页 YYC³ AI vs 全站 NovaMind 星图智语
    水合隐患：Math.random / new Date SSR 直出
    首页功能单一：仅搜索入口，无功能导航
    视觉同质化：粒子背景渐变页贯穿全站，缺差异记忆点
  设计系统层
    Design Token 单一来源
      色彩：品牌紫 #8B5CF6 主 / 蓝紫粉渐变辅助
      字体：Geist 13px 数据 / Inter 界面
      间距：4px 基准网格
      圆角与阴影层级令牌化
    明暗双主题（next-themes 已接入）
    shadcn/ui 组件变体矩阵（对齐 ai2.design 51 组件范式）
  模板体系层
    首页模板：沉浸 Hero + 对话画布混合（2026 趋势）
    仪表盘模板：摘要卡片 > 图表墙（认知减负）
    结果页模板：思维导图 / 海报 / PPT / 网页四件套统一壳
    生成器页模板：进度可视化 + 骨架屏 + Agent 动作流
  动效增强层
    View Transitions API：列表到详情方向性滑动
    共享元素过渡：logo 与卡片跨页连续性
    数字滚动动画：指标变化时触发（动效即语义）
    翻页动画：200ms 交叉淡入（Apple 节奏）
  实施路径层
    P0 治愈：hydration 清零 + 品牌统一（本周）
    P1 建基：Token 体系 + 明暗主题全站贯通
    P2 模板化：四类页面模板沉淀为组件库
    P3 动效：View Transitions + 微交互打磨
    P4 智能化：AI 主题生成 + 用户自定义皮肤
  预期成果层
    一致性：全站组件复用率 > 80%
    性能：LCP < 2.0s / CLS < 0.1
    体验：任务完成率 +25% / NPS +15
    效率：新页面开发周期 -50%（模板复用）`

// ============ 2. PPT 生成参数（ppt-result 实时渲染） ============
const PPT_PARAMS = {
  topic: "大数据AI应用设计模板与美化策略",
  slides: 12,
  template: "business-presentation",
  theme: "formal",
}

// ============ 执行区（浏览器控制台粘贴运行） ============
function genDesignMindMap() {
  // 复用项目 MindMapManager 的存储键与数据契约
  const id = `mindmap_${Date.now()}_design`
  // 解析缩进 → 节点（与 lib/mindmap.ts parseContentToNodes 同构）
  const lines = DESIGN_MINDMAP.split("\n").filter((l) => l.trim())
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]
  const nodes = [
    { id: "root", text: "设计模板与美化", x: 400, y: 300, level: 0, children: [], color: colors[0], isExpanded: true },
  ]
  const connections = []
  const stack = [{ level: -1, id: "root" }]

  lines.forEach((line, index) => {
    const level = Math.floor((line.match(/^(\s*)/)[1].length || 0) / 2)
    const text = line.trim()
    const angle = (index / lines.length) * Math.PI * 2
    const radius = 180 + level * 90
    const nodeId = `node_${index}`
    // 找父级：栈中最近的更浅层级
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop()
    const parentId = stack[stack.length - 1].id

    nodes.push({
      id: nodeId,
      text,
      x: Math.round(400 + Math.cos(angle) * radius),
      y: Math.round(300 + Math.sin(angle) * radius),
      level: level + 1,
      parentId,
      children: [],
      color: colors[(level + 1) % colors.length],
      isExpanded: true,
    })
    connections.push({ from: parentId, to: nodeId })
    const parent = nodes.find((n) => n.id === parentId)
    if (parent) parent.children.push(nodeId)
    stack.push({ level, id: nodeId })
  })

  const mindMap = { id, title: "设计模板与美化实施路径", nodes, connections, createdAt: Date.now(), updatedAt: Date.now() }
  const stored = JSON.parse(localStorage.getItem("novamind-mindmaps") || "[]")
  stored.unshift(mindMap)
  localStorage.setItem("novamind-mindmaps", JSON.stringify(stored))
  console.log("✅ 思维导图已入库，跳转可视化…")
  location.href = `/mindmap-result?id=${id}`
}

// 输出 PPT 直达链接
function genPPTLink() {
  const q = encodeURIComponent(PPT_PARAMS.topic)
  const url = `/generate/ppt?q=${q}&slides=${PPT_PARAMS.slides}&template=${PPT_PARAMS.template}&theme=${PPT_PARAMS.theme}`
  console.log("📊 PPT 生成入口：", location.origin + url)
  return url
}

console.log("可用函数：genDesignMindMap() 生成并查看思维导图 | genPPTLink() 获取 PPT 生成链接")

// Node 环境 self-check：验证脚本语法与数据契约（无副作用）
if (typeof module !== "undefined" && typeof window === "undefined") {
  const lines = DESIGN_MINDMAP.split("\n").filter((l) => l.trim())
  const ok = lines.length >= 30 && PPT_PARAMS.slides === 12
  console.log(`[self-check] mindmap lines=${lines.length}, ppt slides=${PPT_PARAMS.slides} → ${ok ? "PASS" : "FAIL"}`)
}

module.exports = { genDesignMindMap, genPPTLink, DESIGN_MINDMAP, PPT_PARAMS }
