'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Code,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Play,
  Eye,
  Zap,
  FileCode,
  Settings,
} from 'lucide-react'
import { IntelligentFixGenerator, CodeFix, AutoFixSuggestion } from '@/lib/intelligent-fix-generator'

interface IntelligentFixPanelProps {
  issues: any[]
  onApplyFix?: (fixId: string) => void
  onPreviewFix?: (fix: CodeFix) => void
}

export default function IntelligentFixPanel({ 
  issues, 
  onApplyFix,
  onPreviewFix
}: IntelligentFixPanelProps) {
  const [fixSuggestions, setFixSuggestions] = useState<AutoFixSuggestion[]>([])
  const [selectedFix, setSelectedFix] = useState<CodeFix | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyResults, setApplyResults] = useState<any>(null)
  const [previewMode, setPreviewMode] = useState<'before' | 'after'>('after')

  useEffect(() => {
    if (issues.length > 0) {
      const suggestions = IntelligentFixGenerator.generateFixSuggestions(issues)
      setFixSuggestions(suggestions)
    }
  }, [issues])

  const handleApplyAllAutoFixes = async () => {
    setIsApplying(true)
    try {
      const results = await IntelligentFixGenerator.applyAutoFixes(fixSuggestions)
      setApplyResults(results)
    } catch (error) {
      console.error('应用修复失败:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handlePreviewFix = (fix: CodeFix) => {
    setSelectedFix(fix)
    onPreviewFix?.(fix)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const getFixTypeIcon = (type: string) => {
    switch (type) {
      case 'code-replacement': return <Code className="w-4 h-4" />
      case 'code-addition': return <FileCode className="w-4 h-4" />
      case 'config-change': return <Settings className="w-4 h-4" />
      case 'dependency-update': return <Download className="w-4 h-4" />
      default: return <Wand2 className="w-4 h-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600'
    if (confidence >= 80) return 'text-blue-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-500" />
            智能修复建议
          </h2>
          <p className="text-gray-600 mt-1">
            AI 生成的代码修复建议和最佳实践优化
          </p>
        </div>
        
        {fixSuggestions.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleApplyAllAutoFixes}
              disabled={isApplying || !fixSuggestions.some(s => s.canAutoApply)}
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  应用中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  应用自动修复
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 应用结果显示 */}
      {applyResults && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800 mb-2">自动修复完成</div>
            <div className="text-sm text-green-700">
              成功应用 {applyResults.applied} 个修复，
              失败 {applyResults.failed} 个
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 修复建议列表 */}
      {fixSuggestions.length > 0 ? (
        <div className="space-y-4">
          {fixSuggestions.map((suggestion, _index) => (
            <Card key={suggestion.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      {suggestion.category === 'accessibility' && '♿ 无障碍访问'}
                      {suggestion.category === 'performance' && '⚡ 性能优化'}
                      {suggestion.category === 'security' && '🔒 安全加固'}
                      {suggestion.category === 'code-quality' && '📝 代码质量'}
                      {!['accessibility', 'performance', 'security', 'code-quality'].includes(suggestion.category) && `🔧 ${suggestion.category}`}
                      <Badge variant={suggestion.canAutoApply ? 'default' : 'secondary'}>
                        {suggestion.canAutoApply ? '可自动修复' : '需要手动处理'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {suggestion.fixes.length} 个修复建议 | 优先级: {suggestion.priority}
                    </p>
                  </div>
                  
                  {suggestion.requiresReview && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      需要审查
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="space-y-3">
                  {suggestion.fixes.map((fix) => (
                    <div key={fix.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getFixTypeIcon(fix.type)}
                          <span className="font-medium">{fix.title}</span>
                          <Badge variant="outline" className={getConfidenceColor(fix.confidence)}>
                            {fix.confidence}% 置信度
                          </Badge>
                          <Badge variant="outline" className={getImpactColor(fix.estimatedImpact)}>
                            {fix.estimatedImpact} 影响
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewFix(fix)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            预览
                          </Button>
                          
                          {fix.automated && (
                            <Button
                              size="sm"
                              onClick={() => onApplyFix?.(fix.id)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              应用
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{fix.description}</p>
                      
                      {fix.filePath && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <FileCode className="w-3 h-3" />
                          {fix.filePath}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {fix.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Wand2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              暂无修复建议
            </h3>
            <p className="text-gray-500">
              未发现需要自动修复的问题，项目状态良好！
            </p>
          </CardContent>
        </Card>
      )}

      {/* 代码预览弹窗 */}
      {selectedFix && (
        <Dialog open={!!selectedFix} onOpenChange={() => setSelectedFix(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFixTypeIcon(selectedFix.type)}
                {selectedFix.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">{selectedFix.description}</p>
              
              {selectedFix.filePath && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileCode className="w-4 h-4" />
                  <code className="bg-gray-100 px-2 py-1 rounded">{selectedFix.filePath}</code>
                </div>
              )}

              <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'before' | 'after')}>
                {selectedFix.beforeCode && (
                  <TabsList>
                    <TabsTrigger value="before">修复前</TabsTrigger>
                    <TabsTrigger value="after">修复后</TabsTrigger>
                  </TabsList>
                )}

                {selectedFix.beforeCode && (
                  <TabsContent value="before">
                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">原始代码</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedFix.beforeCode || '')}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制
                        </Button>
                      </div>
                      <ScrollArea className="h-64 border rounded">
                        <pre className="p-4 text-sm bg-red-50 text-gray-800 overflow-x-auto">
                          <code>{selectedFix.beforeCode}</code>
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="after">
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">修复后代码</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedFix.afterCode || '')}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制
                      </Button>
                    </div>
                    <ScrollArea className="h-64 border rounded">
                      <pre className="p-4 text-sm bg-green-50 text-gray-800 overflow-x-auto">
                        <code>{selectedFix.afterCode}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={getConfidenceColor(selectedFix.confidence)}>
                    置信度: {selectedFix.confidence}%
                  </span>
                  <span className={getImpactColor(selectedFix.estimatedImpact)}>
                    影响: {selectedFix.estimatedImpact}
                  </span>
                  <Badge variant={selectedFix.automated ? 'default' : 'secondary'}>
                    {selectedFix.automated ? '可自动应用' : '需手动处理'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedFix(null)}>
                    关闭
                  </Button>
                  {selectedFix.automated && (
                    <Button onClick={() => onApplyFix?.(selectedFix.id)}>
                      <Play className="w-4 h-4 mr-2" />
                      应用修复
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}