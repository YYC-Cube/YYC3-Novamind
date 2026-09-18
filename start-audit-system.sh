#!/bin/bash

# 全局智能审核系统快速启动脚本

echo "🚀 启动全局多维度智能审核系统..."
echo ""

# 检查端口占用
check_port() {
    lsof -ti:$1 >/dev/null
}

# 启动服务器
echo "📦 启动开发服务器..."
cd "/Users/yanyu/Desktop/近期开发/智能交互AI"

# 检查并启动服务器
if check_port 3000; then
    echo "⚠️  端口 3000 已被占用，尝试其他端口..."
fi

# 启动 Next.js 开发服务器（后台运行）
pnpm dev &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 尝试不同端口
PORTS=(3000 3001 3002 3003)
SERVER_URL=""

for port in "${PORTS[@]}"; do
    if curl -s "http://localhost:$port" >/dev/null 2>&1; then
        SERVER_URL="http://localhost:$port"
        echo "✅ 服务器成功启动于: $SERVER_URL"
        break
    fi
done

if [ -z "$SERVER_URL" ]; then
    echo "❌ 服务器启动失败"
    exit 1
fi

echo ""
echo "🎯 全局多维度智能审核系统功能概览:"
echo ""
echo "📊 核心功能:"
echo "  • 多维度项目质量评估 (代码质量、功能完整性、性能、用户体验、安全性)"
echo "  • 智能问题检测与分类"
echo "  • AI 驱动的修复建议生成"
echo "  • 一键自动化优化"
echo "  • 实时进度监控"
echo ""
echo "🔧 智能优化特性:"
echo "  • 自动代码修复 (可访问性、性能、安全、代码质量)"
echo "  • 置信度评估 (AI 智能判断修复可靠性)"
echo "  • 批量应用修复"
echo "  • 修复效果预览"
echo "  • 自动验证与回滚"
echo ""
echo "📈 分析与协作:"
echo "  • 高级数据可视化分析"
echo "  • 多维度趋势对比"
echo "  • 团队实时协作"
echo "  • 任务分配与跟踪"
echo "  • 通知中心与消息系统"
echo ""
echo "🌐 访问链接:"
echo "  • 主页: $SERVER_URL"
echo "  • 全局审核: $SERVER_URL/global-audit"
echo "  • 审核首页: $SERVER_URL/global-audit-home"
echo ""

# 如果是 macOS，自动打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 自动打开浏览器..."
    open "$SERVER_URL/global-audit"
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "💡 使用说明:"
echo "  1. 点击 '启动新审核' 开始项目分析"
echo "  2. 切换到 '一键优化' 标签页应用智能修复"
echo "  3. 查看 '深度分析' 了解项目健康趋势"
echo "  4. 使用 '团队协作' 进行实时沟通"
echo ""
echo "⚡ 快捷操作:"
echo "  • Ctrl+C 停止服务器"
echo "  • 刷新页面查看最新状态"
echo "  • 使用浏览器开发者工具查看详细日志"
echo ""

# 保持脚本运行，等待用户停止
echo "按 Ctrl+C 停止服务器..."
wait $SERVER_PID