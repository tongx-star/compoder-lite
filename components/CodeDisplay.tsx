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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">生成的代码</h2>
        <div className="flex space-x-2">
          {code && !isGenerating && (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              onClick={copyToClipboard}
            >
              复制代码
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed min-h-[300px] max-h-[600px] overflow-y-auto whitespace-pre-wrap">
          {isGenerating ? (
            <div className="text-green-400 flex items-center">
              <span className="animate-pulse mr-2">●</span>
              正在生成代码，请稍候...
            </div>
          ) : code ? (
            code
          ) : (
            <div className="text-gray-500">请填写需求描述并点击&quot;生成代码&quot;</div>
          )}
        </pre>
      </div>
    </div>
  )
}