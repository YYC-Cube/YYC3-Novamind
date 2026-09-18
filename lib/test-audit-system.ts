/**
 * 全局多维度审核系统测试脚本
 */

import { GlobalAuditSystem } from './global-audit-system'

// 测试函数
async function testAuditSystem() {
  console.log('🧪 开始测试全局多维度审核系统...')
  
  try {
    // 初始化系统
    console.log('1. 初始化系统...')
    GlobalAuditSystem.initialize()
    
    // 开始审核
    console.log('2. 开始综合审核...')
    const auditResult = await GlobalAuditSystem.startComprehensiveAudit(
      '智能交互AI',
      'test-auditor',
      {
        automated: true,
        generateReport: true
      }
    )
    
    console.log('3. 审核完成，结果如下：')
    console.log(`   - 项目ID: ${auditResult.projectId}`)
    console.log(`   - 总分: ${auditResult.overallScore}`)
    console.log(`   - 等级: ${auditResult.overallGrade}`)
    console.log(`   - 状态: ${auditResult.status}`)
    console.log(`   - 维度数量: ${auditResult.dimensionResults.length}`)
    console.log(`   - 发现问题: ${auditResult.dimensionResults.flatMap(d => d.issues).length} 个`)
    console.log(`   - 优化建议: ${auditResult.recommendations.length} 条`)
    console.log(`   - 预计修复时间: ${auditResult.estimatedCompletionTime} 小时`)
    
    // 详细维度分析
    console.log('\n4. 维度详细分析：')
    auditResult.dimensionResults.forEach(dimension => {
      const dimensionName = getDimensionName(dimension.dimensionId)
      console.log(`   - ${dimensionName}: ${dimension.score} 分 (${dimension.grade})`)
      if (dimension.issues.length > 0) {
        console.log(`     问题: ${dimension.issues.length} 个`)
        dimension.issues.forEach(issue => {
          console.log(`       * [${issue.severity}] ${issue.title}`)
        })
      }
      if (dimension.suggestions.length > 0) {
        console.log(`     建议: ${dimension.suggestions.join(', ')}`)
      }
    })
    
    // 关键建议
    console.log('\n5. 关键建议：')
    auditResult.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.title}`)
      console.log(`      描述: ${rec.description}`)
      console.log(`      类型: ${rec.type}`)
      console.log(`      影响: ${rec.estimatedImpact} | 工作量: ${rec.estimatedEffort}`)
      console.log(`      行动项: ${rec.actionItems.length} 个`)
    })
    
    // 获取统计信息
    console.log('\n6. 系统统计信息：')
    const stats = GlobalAuditSystem.getAuditStats()
    console.log(`   - 总审核次数: ${stats.totalAudits}`)
    console.log(`   - 平均分数: ${stats.averageScore}`)
    console.log(`   - 完成审核: ${stats.completedAudits}`)
    console.log(`   - 待处理问题: ${stats.pendingIssues}`)
    
    // 导出报告
    console.log('\n7. 导出审核报告...')
    const report = GlobalAuditSystem.exportAuditReport(auditResult.id)
    console.log(`   报告长度: ${report.length} 字符`)
    
    console.log('\n✅ 测试完成！系统运行正常')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 辅助函数：获取维度名称
function getDimensionName(dimensionId: string): string {
  const names: Record<string, string> = {
    'code-quality': '代码质量',
    'functionality': '功能完善度',
    'performance': '性能表现',
    'usability': '可用性',
    'security': '安全性'
  }
  return names[dimensionId] || dimensionId
}

// 如果直接运行此文件，则执行测试
if (typeof window === 'undefined') {
  // Node.js 环境
  testAuditSystem()
} else {
  // 浏览器环境
  console.log('审核系统测试脚本已加载，调用 testAuditSystem() 来运行测试')
  ;(window as any).testAuditSystem = testAuditSystem
}

export { testAuditSystem }