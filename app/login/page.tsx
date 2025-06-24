'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Zap, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const mockUsers = ['demo-user', 'test-dev']

  const handleLogin = async (selectedUsername: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUsername }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg"></div>
              <div className="relative flex items-center space-x-3 bg-gradient-primary px-6 py-3 rounded-2xl shadow-lg">
                <Zap className="h-8 w-8 text-primary-foreground" />
                <span className="text-2xl font-bold text-primary-foreground">Compoder Pro</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground mb-2">欢迎回来</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI 驱动的组件代码生成引擎</span>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              选择演示用户
            </label>
            <div className="grid gap-3">
              {mockUsers.map((user) => (
                <Button
                  key={user}
                  variant="outline"
                  onClick={() => handleLogin(user)}
                  disabled={loading}
                  className="justify-start h-12 border-border hover:bg-accent hover:border-primary/50 transition-all"
                >
                  <Github className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">{user}</span>
                  <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary/20">
                    Demo
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">
                或使用自定义用户名
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && username.trim()) {
                  handleLogin(username.trim())
                }
              }}
              className="h-12 text-base"
            />
            <Button
              onClick={() => handleLogin(username.trim())}
              disabled={loading || !username.trim()}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>登录中...</span>
                </div>
              ) : (
                '立即登录'
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="text-center pt-6">
          <div className="w-full space-y-2">
            <p className="text-xs text-muted-foreground">
              这是一个演示版本，使用 Mock GitHub OAuth
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-success font-medium">真实 GitHub OAuth 接口已预留</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
