'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CodeGenForm from '@/components/CodeGenForm'
import CodeDisplay from '@/components/CodeDisplay'
import CodePreview from '@/components/CodePreview'
import GenerationHistory from '@/components/GenerationHistory'

export default function MainPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [code, setCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentDesc, setCurrentDesc] = useState('')
  const [currentLib, setCurrentLib] = useState('')

  useEffect(() => {
    // 检查登录状态
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.replace('/login')
    } else {
      setUser(userData)
    }
  }, [router])

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('user')
    router.replace('/login')
  }

  // 处理代码生成
// 处理代码生成
const handleGenerate = async ({ desc, lib }: { desc: string; lib: string }) => {
    setIsGenerating(true)
    setCode('')
    setCurrentDesc(desc)
    setCurrentLib(lib)
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ desc, lib }),
      })
  
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }
  
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('无法读取响应流')
      }
  
      let generatedCode = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        // 直接解码文本内容
        const chunk = decoder.decode(value, { stream: true })
        generatedCode += chunk
        setCode(generatedCode)
      }
  
      // 生成完成后保存到历史记录
      if (generatedCode && window.saveToHistory) {
        // @ts-ignore
        window.saveToHistory(desc, lib, generatedCode)
      }
    } catch (error) {
      console.error('生成代码时出错:', error)
      setCode(`生成代码时出现错误: ${error}\n\n请检查：\n1. 网络连接是否正常\n2. DEEPSEEK_API_KEY 是否正确配置\n3. API 配额是否充足`)
    } finally {
      setIsGenerating(false)
    }
  }
  // 从历史记录加载
  const handleLoadHistory = (item: any) => {
    setCode(item.code)
    setCurrentDesc(item.desc)
    setCurrentLib(item.lib)
  }

  if (!user) {
    return <div>检查登录状态中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Compoder-Lite</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎，{user}</span>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              onClick={handleLogout}
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 左侧：代码生成表单和历史记录 */}
          <div className="xl:col-span-1 space-y-6">
            <CodeGenForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            <GenerationHistory onLoadHistory={handleLoadHistory} />
          </div>
          
          {/* 右侧：代码展示和预览 */}
          <div className="xl:col-span-2 space-y-6">
            <CodeDisplay code={code} isGenerating={isGenerating} />
            {code && !isGenerating && <CodePreview code={code} />}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-800 mb-2">使用说明：</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 选择 &quot;Ant Design&quot; 将使用 antd 组件库生成代码</li>
            <li>• 选择 &quot;自定义组件库&quot; 将使用预定义的自定义组件规范</li>
            <li>• 生成的代码支持一键复制，并会自动保存到历史记录</li>
            <li>• 点击历史记录可以快速加载之前生成的代码</li>
          </ul>
        </div>
      </main>
    </div>
  )
}