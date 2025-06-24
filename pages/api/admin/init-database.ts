import { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import Codegen from '../../../lib/db/models/Codegen'
import ComponentVersion from '../../../lib/db/models/ComponentVersion'

/**
 * 数据库初始化API
 * POST /api/admin/init-database
 * 
 * 用于在生产环境中安全地创建MongoDB集合和索引
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' })
  }

  // 简单的安全检查（在生产环境中应该使用更强的认证）
  const { adminKey } = req.body
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: '无权限访问' })
  }

  try {
    // 连接数据库
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    const initResults = {
      collections: {} as Record<string, string>,
      indexes: {} as Record<string, string[]>,
      sampleData: false,
      errors: [] as string[]
    }

    // 1. 创建Codegen集合
    try {
      const codegenCollections = await db.listCollections({ name: 'codegens' }).toArray()
      if (codegenCollections.length === 0) {
        await db.createCollection('codegens')
        initResults.collections['codegens'] = 'created'
      } else {
        initResults.collections['codegens'] = 'exists'
      }

      // 创建索引
      await Codegen.createIndexes()
      const codegenIndexes = await Codegen.collection.getIndexes()
      initResults.indexes['codegens'] = Object.keys(codegenIndexes)
    } catch (error) {
      initResults.errors.push(`Codegen集合创建失败: ${(error as Error).message}`)
    }

    // 2. 创建ComponentVersion集合
    try {
      const versionCollections = await db.listCollections({ name: 'componentversions' }).toArray()
      if (versionCollections.length === 0) {
        await db.createCollection('componentversions')
        initResults.collections['componentversions'] = 'created'
      } else {
        initResults.collections['componentversions'] = 'exists'
      }

      // 创建索引
      await ComponentVersion.createIndexes()
      const versionIndexes = await ComponentVersion.collection.getIndexes()
      initResults.indexes['componentversions'] = Object.keys(versionIndexes)
    } catch (error) {
      initResults.errors.push(`ComponentVersion集合创建失败: ${(error as Error).message}`)
    }

    // 3. 插入示例数据（仅在请求时）
    if (req.body.insertSampleData) {
      try {
        const existingCount = await Codegen.countDocuments()
        if (existingCount === 0) {
          await insertSampleData()
          initResults.sampleData = true
        }
      } catch (error) {
        initResults.errors.push(`示例数据插入失败: ${(error as Error).message}`)
      }
    }

    // 4. 获取集合统计信息
    const stats = {
      codegens: {
        count: await Codegen.countDocuments(),
        indexes: initResults.indexes['codegens']?.length || 0
      },
      componentversions: {
        count: await ComponentVersion.countDocuments(),
        indexes: initResults.indexes['componentversions']?.length || 0
      }
    }

    return res.status(200).json({
      success: true,
      message: '数据库初始化完成',
      results: initResults,
      stats: stats
    })

  } catch (error) {
    console.error('数据库初始化错误:', error)
    return res.status(500).json({
      success: false,
      error: '数据库初始化失败',
      message: (error as Error).message
    })
  }
}

/**
 * 插入示例数据
 */
async function insertSampleData() {
  const demoUserId = new mongoose.Types.ObjectId()
  
  const demoCodegen = await Codegen.create({
    title: '示例按钮组件',
    description: '一个现代化的按钮组件示例',
    userId: demoUserId,
    status: 'completed',
    prompt: [{
      type: 'text',
      content: '创建一个支持多种样式的按钮组件'
    }],
    workflow: {
      designPhase: {
        componentName: 'CustomButton',
        componentDescription: '自定义按钮组件',
        selectedLibraries: ['antd'],
        retrievedKnowledge: '按钮组件设计原则...'
      },
      generatePhase: {
        generatedCode: `import React from 'react';
import { Button } from 'antd';

interface CustomButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false
}) => {
  return (
    <Button
      type={variant === 'primary' ? 'primary' : variant === 'danger' ? 'primary' : 'default'}
      size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle'}
      onClick={onClick}
      disabled={disabled}
      danger={variant === 'danger'}
    >
      {children}
    </Button>
  );
};

export default CustomButton;`,
        aiModel: 'gpt-4',
        ragContext: '基于Ant Design的组件开发...'
      }
    },
    currentVersion: 1
  })

  await ComponentVersion.create({
    codegenId: demoCodegen._id,
    version: 1,
    code: demoCodegen.workflow.generatePhase!.generatedCode,
    prompt: '创建一个支持多种样式的按钮组件',
    aiModel: 'gpt-4',
    ragContext: '基于Ant Design的组件开发...'
  })
} 