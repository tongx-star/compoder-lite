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
        <div className="border border-border p-4 rounded-md bg-muted">
          <p className="text-muted-foreground text-sm mb-2">代码预览（模拟）：</p>
          <div className="bg-card p-4 rounded border border-border">
            <p className="text-card-foreground">
              {code.includes('Button') && '🔘 按钮组件'}
              {code.includes('Input') && ' 📝 输入框组件'}
              {code.includes('Form') && ' 📋 表单组件'}
              {code.includes('Card') && ' 🗃️ 卡片组件'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              实际项目中，这里会渲染真实的组件预览
            </p>
          </div>
        </div>
      )
    } catch {
      return (
        <div className="border border-border p-4 rounded-md bg-destructive/10">
          <p className="text-destructive">预览加载失败</p>
        </div>
      )
    }
  }

  return (
    <div className="mt-4">
      <button
        className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:bg-accent/80 transition-colors text-sm border border-border"
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