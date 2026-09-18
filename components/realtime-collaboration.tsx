'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageCircle,
  Bell,
  Video,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  UserCheck,
  Calendar,
  Zap
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  avatar: string
  role: string
  status: 'online' | 'away' | 'offline'
  currentTask?: string
  progress: number
}

interface Comment {
  id: string
  author: TeamMember
  content: string
  timestamp: Date
  type: 'comment' | 'suggestion' | 'issue'
  isResolved?: boolean
  replies?: Comment[]
  reactions?: { emoji: string; count: number; users: string[] }[]
}

interface Task {
  id: string
  title: string
  description: string
  assignee: TeamMember
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate: Date
  progress: number
  tags: string[]
}

export function RealTimeCollaboration() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('team')

  useEffect(() => {
    // 模拟团队数据
    setTeamMembers([
      {
        id: '1',
        name: '张三',
        avatar: '/api/placeholder/32/32',
        role: '前端开发',
        status: 'online',
        currentTask: '优化用户界面响应性',
        progress: 75
      },
      {
        id: '2', 
        name: '李四',
        avatar: '/api/placeholder/32/32',
        role: '后端开发',
        status: 'online',
        currentTask: 'API 性能优化',
        progress: 60
      },
      {
        id: '3',
        name: '王五',
        avatar: '/api/placeholder/32/32',
        role: 'UI/UX 设计师',
        status: 'away',
        currentTask: '用户体验改进方案',
        progress: 90
      },
      {
        id: '4',
        name: '赵六',
        avatar: '/api/placeholder/32/32',
        role: '测试工程师', 
        status: 'offline',
        currentTask: '自动化测试脚本',
        progress: 45
      }
    ])

    // 模拟评论数据
    setComments([
      {
        id: '1',
        author: {
          id: '1',
          name: '张三',
          avatar: '/api/placeholder/32/32',
          role: '前端开发',
          status: 'online',
          progress: 75
        },
        content: '这个智能修复功能真的很棒！自动检测到了几个可访问性问题。',
        timestamp: new Date(Date.now() - 30 * 60000),
        type: 'comment',
        reactions: [
          { emoji: '👍', count: 3, users: ['李四', '王五', '赵六'] },
          { emoji: '🎉', count: 1, users: ['李四'] }
        ]
      },
      {
        id: '2',
        author: {
          id: '2',
          name: '李四', 
          avatar: '/api/placeholder/32/32',
          role: '后端开发',
          status: 'online',
          progress: 60
        },
        content: '建议我们针对数据库查询进行进一步优化，当前的性能分析显示还有提升空间。',
        timestamp: new Date(Date.now() - 15 * 60000),
        type: 'suggestion'
      }
    ])

    // 模拟任务数据
    setTasks([
      {
        id: '1',
        title: '修复可访问性问题',
        description: '根据智能修复建议，优化页面的可访问性标准',
        assignee: teamMembers[0] || {} as TeamMember,
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        progress: 75,
        tags: ['前端', '可访问性', '智能修复']
      },
      {
        id: '2',
        title: '性能优化实施',
        description: '应用智能修复建议的性能优化方案',
        assignee: teamMembers[1] || {} as TeamMember,
        status: 'review',
        priority: 'medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        progress: 90,
        tags: ['后端', '性能', '优化']
      }
    ])
  }, [])

  const handleSendComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        id: 'current',
        name: '当前用户',
        avatar: '/api/placeholder/32/32',
        role: '开发者',
        status: 'online',
        progress: 0
      },
      content: newComment,
      timestamp: new Date(),
      type: 'comment'
    }

    setComments([...comments, comment])
    setNewComment('')
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500' 
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo': return <Clock className="w-4 h-4 text-gray-500" />
      case 'in-progress': return <Zap className="w-4 h-4 text-blue-500" />
      case 'review': return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">实时协作中心</h2>
          <p className="text-gray-600">团队协作，共同提升项目质量</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Video className="w-4 h-4 mr-2" />
            开始会议
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            分享
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">团队状态</TabsTrigger>
          <TabsTrigger value="comments">实时讨论</TabsTrigger>
          <TabsTrigger value="tasks">任务分配</TabsTrigger>
          <TabsTrigger value="notifications">通知中心</TabsTrigger>
        </TabsList>

        {/* 团队状态 */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                      {member.status === 'online' ? '在线' : member.status === 'away' ? '离开' : '离线'}
                    </Badge>
                  </div>

                  {member.currentTask && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">当前任务</div>
                      <div className="text-sm text-gray-600">{member.currentTask}</div>
                      <div className="flex items-center gap-2">
                        <Progress value={member.progress} className="flex-1" />
                        <span className="text-sm text-gray-500">{member.progress}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 实时讨论 */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                团队讨论
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 mb-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.author.role}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {comment.timestamp.toLocaleTimeString()}
                          </span>
                          {comment.type === 'suggestion' && (
                            <Badge variant="secondary" className="text-xs">
                              建议
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-700">{comment.content}</div>
                        {comment.reactions && (
                          <div className="flex gap-2 mt-2">
                            {comment.reactions.map((reaction, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                              >
                                {reaction.emoji} {reaction.count}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="输入你的想法..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleSendComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 任务分配 */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{task.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback>{task.assignee.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      截止: {task.dueDate.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>进度</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 通知中心 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                最新通知
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">智能修复建议已生成</div>
                    <div className="text-sm text-gray-600">
                      系统检测到8个可优化项目，建议立即处理
                    </div>
                    <div className="text-xs text-gray-500 mt-1">5分钟前</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">任务完成</div>
                    <div className="text-sm text-gray-600">
                      张三已完成「修复可访问性问题」任务
                    </div>
                    <div className="text-xs text-gray-500 mt-1">15分钟前</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <UserCheck className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">团队成员上线</div>
                    <div className="text-sm text-gray-600">
                      李四已上线并开始工作
                    </div>
                    <div className="text-xs text-gray-500 mt-1">30分钟前</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}