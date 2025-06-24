import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db/connection'
import Codegen from '@/lib/db/models/Codegen'
import mongoose from 'mongoose'
import { designPhaseStep, codeGenerationStep, saveVersionStep } from '@/lib/ai/workflow/steps'
import { WorkflowContext } from '@/lib/ai/workflow/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '项目ID无效' })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' })
  }

  try {
    await connectDB()

    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: '项目ID格式无效' })
    }

    // 查找项目
    const codegen = await Codegen.findById(id)
    if (!codegen) {
      return res.status(404).json({ error: '项目不存在' })
    }

    // 对于GET请求，检查项目状态但允许重新生成
    if (req.method === 'POST') {
      if (codegen.status === 'generating') {
        return res.status(409).json({ error: '项目正在生成中，请稍后再试' })
      }
    }

    // 设置服务器发送事件 (SSE) 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    // 发送事件的辅助函数
    const sendEvent = (type: string, data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    }

    // 创建增强的流式响应对象
    const stream = {
      write: (message: string) => {
        sendEvent('log', { message })
      },
      writeCode: (chunk: string) => {
        sendEvent('code-chunk', { chunk })
      },
      startCode: () => {
        sendEvent('code-start', {})
      },
      endCode: () => {
        sendEvent('code-complete', {})
      },
      updateStatus: (status: string) => {
        sendEvent('status-update', { status })
      },
      error: (message: string) => {
        sendEvent('error', { message })
      },
      close: () => {
        res.end()
      }
    }

    // 更新项目状态为生成中
    await Codegen.findByIdAndUpdate(id, { status: 'generating' })
    stream.updateStatus('generating')

    try {
      // 获取选择的库和提示词
      const selectedLib = codegen.workflow?.designPhase?.selectedLibraries?.[0] || 'antd'
      const prompt = codegen.prompt || [{ type: 'text', content: codegen.description }]
      
      // 构建工作流上下文
      const context: WorkflowContext = {
        query: {
          codegenId: id,
          prompt: prompt,
          userId: codegen.userId.toString(),
          selectedLibraries: selectedLib === 'antd' ? 'antd' : selectedLib === 'shadcn' ? 'shadcn' : 'custom'
        },
        state: codegen.workflow || {},
        stream
      }

      stream.write('🚀 开始代码生成工作流...')

      // 执行工作流步骤
      let updatedContext = context

      // 步骤1: 设计阶段
      if (!updatedContext.state?.designPhase) {
        stream.updateStatus('designing')
        stream.write('🎨 开始设计分析阶段...')
        updatedContext = await designPhaseStep(updatedContext)
      } else {
        stream.write('⏭️ 跳过设计阶段（已完成）')
      }

      // 步骤2: 代码生成阶段
      stream.updateStatus('generating')
      stream.write('🚀 开始代码生成阶段...')
      updatedContext = await codeGenerationStep(updatedContext)

      // 步骤3: 版本保存阶段
      stream.write('💾 保存代码版本...')
      updatedContext = await saveVersionStep(updatedContext)

      // 更新最终状态
      stream.updateStatus('completed')
      stream.write('🎉 代码生成完成！')
      
      // 发送完成信号
      sendEvent('complete', { 
        codegenId: id,
        generatedCode: updatedContext.state?.generatePhase?.generatedCode 
      })

    } catch (error) {
      console.error('代码生成失败:', error)
      
      // 更新项目状态为失败
      await Codegen.findByIdAndUpdate(id, { 
        status: 'failed',
        'workflow.error': error instanceof Error ? error.message : '未知错误'
      })

      const errorMessage = error instanceof Error ? error.message : '未知错误'
      stream.updateStatus('failed')
      stream.error(`生成失败: ${errorMessage}`)
      
      sendEvent('error', { 
        error: errorMessage
      })
    }

    // 结束连接
    setTimeout(() => {
      res.end()
    }, 1000) // 给客户端一点时间接收最后的消息

  } catch (error) {
    console.error('启动代码生成失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
} 