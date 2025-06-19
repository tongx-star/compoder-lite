'use client'
import { useState, useEffect, useCallback } from 'react'

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

  const saveToHistory = useCallback((desc: string, lib: string, code: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      desc,
      lib,
      code,
      timestamp: Date.now()
    }
    
    setHistory(prevHistory => {
      const updatedHistory = [newItem, ...prevHistory.slice(0, 9)] // 最多保存10条记录
      localStorage.setItem('codegenHistory', JSON.stringify(updatedHistory))
      return updatedHistory
    })
  }, [])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('codegenHistory')
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  // 暴露保存方法供父组件调用
  useEffect(() => {
    window.saveToHistory = saveToHistory
  }, [saveToHistory])

  return (
    <div className="mt-4">
      <button
        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        历史记录 ({history.length})
      </button>
      
      {isOpen && (
        <div className="mt-4 bg-card border border-border rounded-md p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-card-foreground">生成历史</h3>
            {history.length > 0 && (
              <button
                className="text-destructive hover:text-destructive/80 text-sm"
                onClick={clearHistory}
              >
                清空历史
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无历史记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-md p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onLoadHistory(item)}
                >
                  <p className="font-medium text-sm truncate text-card-foreground">{item.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">
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