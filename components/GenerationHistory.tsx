'use client'
import { useState, useEffect } from 'react'

interface HistoryItem {
  id: string
  desc: string
  lib: string
  code: string
  timestamp: number
}

interface GenerationHistoryProps {
  onLoadHistory: (item: HistoryItem) => void
}

export default function GenerationHistory({ onLoadHistory }: GenerationHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 从 localStorage 加载历史记录
    const savedHistory = localStorage.getItem('codegenHistory')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }, [])

  const saveToHistory = (desc: string, lib: string, code: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      desc,
      lib,
      code,
      timestamp: Date.now()
    }
    
    const updatedHistory = [newItem, ...history.slice(0, 9)] // 最多保存10条记录
    setHistory(updatedHistory)
    localStorage.setItem('codegenHistory', JSON.stringify(updatedHistory))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('codegenHistory')
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  // 暴露保存方法供父组件调用
  useEffect(() => {
    // @ts-ignore
    window.saveToHistory = saveToHistory
  }, [history])

  return (
    <div className="mt-4">
      <button
        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        历史记录 ({history.length})
      </button>
      
      {isOpen && (
        <div className="mt-4 bg-white border rounded-md p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">生成历史</h3>
            {history.length > 0 && (
              <button
                className="text-red-500 hover:text-red-700 text-sm"
                onClick={clearHistory}
              >
                清空历史
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无历史记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onLoadHistory(item)}
                >
                  <p className="font-medium text-sm truncate">{item.desc}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.lib === 'antd' ? 'Ant Design' : '自定义组件库'} • {formatTime(item.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}