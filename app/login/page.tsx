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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Compoder-Lite</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="请输入用户名"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors"
            onClick={handleLogin}
          >
            登录
          </button>
        </div>
      </div>
    </div>
  )
}