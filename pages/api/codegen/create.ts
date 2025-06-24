import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db/connection'
import Codegen from '@/lib/db/models/Codegen'
import mongoose from 'mongoose'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' })
  }

  try {
    await connectDB()

    const { title, description, selectedLibrary = 'antd' } = req.body

    if (!title || !description) {
      return res.status(400).json({ error: '标题和描述不能为空' })
    }

    // 创建新的代码生成项目
    const newCodegen = new Codegen({
      title: title.trim(),
      description: description.trim(),
      userId: new mongoose.Types.ObjectId(), // 临时使用随机ObjectId，实际应该从session获取
      status: 'pending',
      currentVersion: 1,
      prompt: [{
        type: 'text',
        content: description.trim()
      }],
      workflow: {
        designPhase: {
          componentName: '',
          componentDescription: description.trim(),
          selectedLibraries: [selectedLibrary]
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const savedCodegen = await newCodegen.save()

    res.status(201).json({
      success: true,
      codegenId: savedCodegen._id,
      message: '项目创建成功'
    })

  } catch (error) {
    console.error('创建代码生成项目失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
} 