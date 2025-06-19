'use client'
import { useState } from 'react'

interface CodePreviewProps {
  code: string
}

export default function CodePreview({ code }: CodePreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  // 简单的代码预览功能（在实际项目中，你可能需要使用 iframe 或更复杂的沙箱环境）
  const renderPreview = () => {
    if (!code) return null

    try {
      // 这里只是一个示例，实际的代码预览需要更复杂的实现
      return (
        <div className="border p-4 rounded-md bg-gray-50">
          <p className="text-gray-600 text-sm mb-2">代码预览（模拟）：</p>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-800">
              {code.includes('Button') && '🔘 按钮组件'}
              {code.includes('Input') && ' 📝 输入框组件'}
              {code.includes('Form') && ' 📋 表单组件'}
              {code.includes('Card') && ' 🗃️ 卡片组件'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              实际项目中，这里会渲染真实的组件预览
            </p>
          </div>
        </div>
      )
    } catch {
      return (
        <div className="border p-4 rounded-md bg-red-50">
          <p className="text-red-600">预览加载失败</p>
        </div>
      )
    }
  }

  return (
    <div className="mt-4">
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? '隐藏预览' : '预览组件'}
      </button>
      
      {showPreview && (
        <div className="mt-4">
          {renderPreview()}
        </div>
      )}
    </div>
  )
}