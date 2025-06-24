'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, FileCode, Zap, Play, Terminal, Copy } from 'lucide-react'

interface CodegenDetail {
  _id: string
  title: string
  description: string
  status: 'pending' | 'designing' | 'generating' | 'completed' | 'failed'
  currentVersion: number
  createdAt: string
  workflow?: {
    designPhase?: {
      componentName: string
      componentDescription: string
      selectedLibraries: string[]
    }
    generatePhase?: {
      generatedCode: string
      aiModel: string
    }
  }
}

interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error' | 'code'
}

export default function CodegenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [codegen, setCodegen] = useState<CodegenDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [streamingCode, setStreamingCode] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (params?.id) {
      fetchCodegenDetail(params.id as string)
    }
  }, [params?.id])

  // 自动滚动到日志底部
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, streamingCode])

  // 清理 EventSource 连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const fetchCodegenDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/codegen/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCodegen(data.codegen)
      } else {
        console.error('获取项目详情失败')
      }
    } catch (error) {
      console.error('获取项目详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type
    }
    setLogs(prev => [...prev, newLog])
  }

  const handleStartGeneration = async () => {
    if (!codegen) return

    setIsGenerating(true)
    setLogs([])
    setStreamingCode('')
    setIsStreaming(false)

    try {
      addLog('🚀 开始启动代码生成流程...', 'info')

      // 关闭之前的连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // 建立 SSE 连接
      const eventSource = new EventSource(`/api/codegen/${codegen._id}/start`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        addLog('✅ 已连接到生成服务器', 'success')
      }

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'log':
            addLog(data.message, 'info')
            break
          case 'error':
            addLog(`❌ ${data.message}`, 'error')
            break
          case 'code-start':
            addLog('🤖 开始流式生成代码...', 'info')
            setIsStreaming(true)
            setStreamingCode('')
            break
          case 'code-chunk':
            setStreamingCode(prev => prev + data.chunk)
            break
          case 'code-complete':
            addLog('✅ 代码生成完成', 'success')
            setIsStreaming(false)
            break
          case 'status-update':
            // 更新项目状态
            if (codegen) {
              setCodegen(prev => prev ? { ...prev, status: data.status } : null)
            }
            break
          case 'complete':
            addLog('🎉 整个工作流程完成！', 'success')
            setIsGenerating(false)
            // 重新获取完整的项目数据
            fetchCodegenDetail(codegen._id)
            break
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE 连接错误:', error)
        addLog('❌ 连接中断，请刷新页面重试', 'error')
        setIsGenerating(false)
        eventSource.close()
      }

    } catch (error) {
      console.error('启动生成失败:', error)
      addLog(`❌ 启动失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('📋 代码已复制到剪贴板', 'success')
    }).catch(() => {
      addLog('❌ 复制失败', 'error')
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'generating':
      case 'designing':
        return <Clock className="h-5 w-5 text-info animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: '等待中',
      designing: '设计中',
      generating: '生成中',
      completed: '已完成',
      failed: '失败'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'error':
        return 'text-destructive'
      case 'code':
        return 'text-info'
      default:
        return 'text-foreground'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-medium">加载中...</p>
        </div>
      </div>
    )
  }

  if (!codegen) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-foreground font-medium mb-4">项目不存在</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回工作台
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto p-6 relative z-10">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回工作台
          </Button>
          
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">项目详情</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 左侧：项目信息和工作流进度 */}
          <div className="space-y-6">
            {/* 项目信息卡片 */}
            <Card className="border-border shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      {codegen.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {codegen.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(codegen.status)}
                    <Badge variant="outline" className="text-sm">
                      {getStatusText(codegen.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    创建时间: {new Date(codegen.createdAt).toLocaleString('zh-CN')}
                  </div>
                  {(codegen.status === 'pending' || codegen.status === 'failed') && !isGenerating && (
                    <Button 
                      onClick={handleStartGeneration}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {codegen.status === 'failed' ? '重新生成' : '开始生成'}
                    </Button>
                  )}
                  {isGenerating && (
                    <Button disabled className="bg-muted text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 工作流进度 */}
            {codegen.workflow && (
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">工作流进度</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {codegen.workflow.designPhase && (
                    <div className="border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">设计阶段</h4>
                      <div className="space-y-2 text-sm">
                        {codegen.workflow.designPhase.componentName && (
                          <p><span className="font-medium">组件名称:</span> {codegen.workflow.designPhase.componentName}</p>
                        )}
                        <p><span className="font-medium">选择的UI库:</span> {codegen.workflow.designPhase.selectedLibraries?.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {codegen.workflow.generatePhase && (
                    <div className="border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">生成阶段</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">AI模型:</span> {codegen.workflow.generatePhase.aiModel}</p>
                        {codegen.workflow.generatePhase.generatedCode && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">生成的代码:</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(codegen.workflow!.generatePhase!.generatedCode)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                复制
                              </Button>
                            </div>
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                              <code>{codegen.workflow.generatePhase.generatedCode}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：实时日志和流式输出 */}
          <div className="space-y-6">
            {/* 实时日志 */}
            <Card className="border-border shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold text-foreground">实时日志</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      等待开始生成...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-2">
                          <span className="text-muted-foreground text-xs mt-0.5">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={getLogColor(log.type)}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 流式代码输出 */}
            {(isStreaming || streamingCode) && (
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCode className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl font-bold text-foreground">
                        实时代码生成
                        {isStreaming && <span className="ml-2 text-sm text-info">生成中...</span>}
                      </CardTitle>
                    </div>
                    {streamingCode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(streamingCode)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 h-96 overflow-y-auto">
                    <pre className="text-xs font-mono">
                      <code>{streamingCode}</code>
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 