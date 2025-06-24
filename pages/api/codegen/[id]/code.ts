import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db/connection'
import Codegen from '@/lib/db/models/Codegen'
import mongoose from 'mongoose'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '项目ID无效' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' })
  }

  try {
    await connectDB()

    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: '项目ID格式无效' })
    }

    // 查找项目
    const codegen = await Codegen.findById(id).lean()

    if (!codegen || Array.isArray(codegen)) {
      return res.status(404).json({ error: '项目不存在' })
    }

    // 检查是否有生成的代码
    const generatedCode = codegen.workflow?.generatePhase?.generatedCode

    if (!generatedCode) {
      return res.status(404).json({ error: '代码尚未生成' })
    }

    res.status(200).json({
      success: true,
      data: {
        codegenId: codegen._id,
        title: codegen.title,
        description: codegen.description,
        status: codegen.status,
        generatedCode,
        aiModel: codegen.workflow?.generatePhase?.aiModel,
        componentName: codegen.workflow?.designPhase?.componentName,
        selectedLibraries: codegen.workflow?.designPhase?.selectedLibraries,
        createdAt: codegen.createdAt,
        updatedAt: codegen.updatedAt
      }
    })

  } catch (error) {
    console.error('获取生成代码失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
} 