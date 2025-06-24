import { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db/connection'
import Codegen from '@/lib/db/models/Codegen'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' })
  }

  try {
    await connectDB()

    // 获取所有代码生成项目，按创建时间倒序排列
    const codegens = await Codegen.find({})
      .sort({ createdAt: -1 })
      .limit(50) // 限制返回数量
      .lean()

    res.status(200).json({
      success: true,
      codegens: codegens.map(codegen => ({
        _id: codegen._id,
        title: codegen.title,
        description: codegen.description,
        status: codegen.status,
        currentVersion: codegen.currentVersion,
        createdAt: codegen.createdAt,
        workflow: codegen.workflow
      }))
    })

  } catch (error) {
    console.error('获取代码生成项目列表失败:', error)
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
} 