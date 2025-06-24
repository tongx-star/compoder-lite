'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Clock, CheckCircle, AlertCircle, FileCode, Sparkles, Zap } from 'lucide-react'

interface CodegenItem {
  _id: string
  title: string
  description: string
  status: 'pending' | 'designing' | 'generating' | 'completed' | 'failed'
  currentVersion: number
  createdAt: string
  workflow?: {
    designPhase?: {
      componentName: string
      selectedLibraries: string[]
    }
  }
}

export default function DashboardPage() {
  const [codegens, setCodegens] = useState<CodegenItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newCodegen, setNewCodegen] = useState({
    title: '',
    description: '',
    selectedLibrary: 'antd'
  })
  const router = useRouter()

  useEffect(() => {
    fetchCodegens()
  }, [])

  const fetchCodegens = async () => {
    try {
      const response = await fetch('/api/codegen/list')
      if (response.ok) {
        const data = await response.json()
        setCodegens(data.codegens || [])
      }
    } catch (error) {
      console.error('获取代码生成列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCodegen = async () => {
    if (!newCodegen.title.trim() || !newCodegen.description.trim()) {
      alert('请填写完整信息')
      return
    }

    try {
      const response = await fetch('/api/codegen/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCodegen),
      })

      if (response.ok) {
        const data = await response.json()
        setCreateDialogOpen(false)
        setNewCodegen({ title: '', description: '', selectedLibrary: 'antd' })
        router.push(`/codegen/${data.codegenId}`)
      } else {
        const error = await response.json()
        alert(error.error || '创建失败')
      }
    } catch (error) {
      console.error('创建代码生成任务失败:', error)
      alert('创建失败，请重试')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'generating':
      case 'designing':
        return <Clock className="h-4 w-4 text-info animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'generating':
      case 'designing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium">加载中...</p>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-2 bg-gradient-primary px-4 py-2 rounded-lg shadow-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
                <span className="text-lg font-bold text-primary-foreground">Compoder Pro</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">工作台</h1>
            <p className="text-muted-foreground text-lg">管理你的 AI 组件生成项目</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-5 w-5 mr-2" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">创建新的代码生成项目</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>开始一个新的 AI 组件代码生成任务</span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">项目标题</label>
                  <Input
                    placeholder="例如：用户登录表单"
                    value={newCodegen.title}
                    onChange={(e) => setNewCodegen(prev => ({ ...prev, title: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">项目描述</label>
                  <Textarea
                    placeholder="描述你想要生成的组件功能和需求..."
                    value={newCodegen.description}
                    onChange={(e) => setNewCodegen(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">组件库选择</label>
                  <Select
                    value={newCodegen.selectedLibrary}
                    onValueChange={(value) => setNewCodegen(prev => ({ ...prev, selectedLibrary: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antd">Ant Design</SelectItem>
                      <SelectItem value="shadcn">Shadcn UI</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateCodegen} className="bg-primary hover:bg-primary/90">
                  创建项目
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {codegens.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-xl bg-gradient-card">
            <CardHeader>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                <FileCode className="h-16 w-16 text-primary mx-auto relative z-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground mb-2">还没有项目</CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                创建你的第一个 AI 组件生成项目，开始探索无限可能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all px-8 py-3 text-base"
              >
                <Plus className="h-5 w-5 mr-2" />
                开始创建
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {codegens.map((codegen) => (
              <Card
                key={codegen._id}
                className="hover:shadow-xl transition-all cursor-pointer border-0 bg-card/80 backdrop-blur-sm hover:bg-card group"
                onClick={() => router.push(`/codegen/${codegen._id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">
                      {codegen.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(codegen.status)}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 text-muted-foreground">
                    {codegen.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(codegen.status)} className="font-medium">
                        {getStatusText(codegen.status)}
                      </Badge>
                      {codegen.workflow?.designPhase?.selectedLibraries?.[0] && (
                        <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent">
                          {codegen.workflow.designPhase.selectedLibraries[0]}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      v{codegen.currentVersion}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    创建于 {new Date(codegen.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
