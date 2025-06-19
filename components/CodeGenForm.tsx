'use client'
import { useState } from 'react'

interface CodeGenFormProps {
  onGenerate: (input: { desc: string; lib: string }) => void
  isGenerating?: boolean
}

export default function CodeGenForm({ onGenerate, isGenerating = false }: CodeGenFormProps) {
  const [desc, setDesc] = useState('')
  const [lib, setLib] = useState('antd')

  const handleSubmit = () => {
    if (!desc.trim()) {
      alert('请输入组件需求描述')
      return
    }
    onGenerate({ desc, lib })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">AI 代码生成</h2>
      
      <div className="space-y-4">
        {/* 需求描述输入框 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            组件需求描述
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder="例如：创建一个用户登录表单，包含用户名、密码输入框和登录按钮"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* 组件库选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            组件库选择
          </label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lib} 
            onChange={(e) => setLib(e.target.value)}
            disabled={isGenerating}
          >
            <option value="antd">Ant Design (antd)</option>
            <option value="custom">自定义组件库</option>
          </select>
        </div>

        {/* 生成按钮 */}
        <button
          className={`w-full p-3 rounded-md text-white font-medium transition-colors ${
            isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
          onClick={handleSubmit}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '生成代码'}
        </button>
      </div>
    </div>
  )
}