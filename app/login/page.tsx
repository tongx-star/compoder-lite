'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  useEffect(() => {
    // 如果已经登录，直接跳转到主页
    if (localStorage.getItem('user')) {
      router.replace('/main')
    }
  }, [router])

  function handleLogin() {
    if (username.trim()) {
      localStorage.setItem('user', username)
      router.replace('/main')
    } else {
      alert('请输入用户名')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md w-96 border border-border">
        <h1 className="text-2xl font-bold text-center mb-6 text-card-foreground">Compoder-Lite</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="请输入用户名"
            className="w-full p-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            className="w-full bg-primary text-primary-foreground p-3 rounded-md hover:bg-primary/90 transition-colors"
            onClick={handleLogin}
          >
            登录
          </button>
        </div>
      </div>
    </div>
  )
}