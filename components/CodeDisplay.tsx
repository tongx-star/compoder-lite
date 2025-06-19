'use client'

interface CodeDisplayProps {
  code: string
  isGenerating?: boolean
}

export default function CodeDisplay({ code, isGenerating = false }: CodeDisplayProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      alert('代码已复制到剪贴板！')
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制')
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-card-foreground">生成的代码</h2>
        <div className="flex space-x-2">
          {code && !isGenerating && (
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
              onClick={copyToClipboard}
            >
              复制代码
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <pre className="bg-secondary text-secondary-foreground p-4 rounded-md overflow-x-auto text-sm leading-relaxed min-h-[300px] max-h-[600px] overflow-y-auto whitespace-pre-wrap border border-border">
          {isGenerating ? (
            <div className="text-primary flex items-center">
              <span className="animate-pulse mr-2">●</span>
              正在生成代码，请稍候...
            </div>
          ) : code ? (
            code
          ) : (
            <div className="text-muted-foreground">请填写需求描述并点击&quot;生成代码&quot;</div>
          )}
        </pre>
      </div>
    </div>
  )
}