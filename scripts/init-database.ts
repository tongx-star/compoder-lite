import mongoose from 'mongoose'
import Codegen from '../lib/db/models/Codegen'
import ComponentVersion from '../lib/db/models/ComponentVersion'

/**
 * 数据库初始化脚本
 * 用于在MongoDB中创建集合、索引和初始数据
 */
async function initDatabase() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/compoder-lite'
    await mongoose.connect(mongoUri)
    console.log('✅ 数据库连接成功')

    // 获取数据库实例
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    // 1. 创建Codegen集合
    console.log('🔄 开始创建Codegen集合...')
    
    // 检查集合是否已存在
    const collections = await db.listCollections({ name: 'codegens' }).toArray()
    if (collections.length === 0) {
      // 创建集合
      await db.createCollection('codegens')
      console.log('✅ Codegen集合创建成功')
    } else {
      console.log('ℹ️  Codegen集合已存在')
    }

    // 创建Codegen索引
    await Codegen.createIndexes()
    console.log('✅ Codegen索引创建成功')

    // 2. 创建ComponentVersion集合
    console.log('🔄 开始创建ComponentVersion集合...')
    
    const versionCollections = await db.listCollections({ name: 'componentversions' }).toArray()
    if (versionCollections.length === 0) {
      await db.createCollection('componentversions')
      console.log('✅ ComponentVersion集合创建成功')
    } else {
      console.log('ℹ️  ComponentVersion集合已存在')
    }

    // 创建ComponentVersion索引
    await ComponentVersion.createIndexes()
    console.log('✅ ComponentVersion索引创建成功')

    // 3. 插入初始数据（可选）
    await insertInitialData()

    // 4. 验证集合创建
    await validateCollections()

    console.log('🎉 数据库初始化完成!')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 数据库连接已关闭')
  }
}

/**
 * 插入初始数据
 */
async function insertInitialData() {
  console.log('🔄 插入初始数据...')
  
  try {
    // 检查是否已有数据
    const codegenCount = await Codegen.countDocuments()
    if (codegenCount === 0) {
      // 创建示例用户ID（在真实环境中应该从User集合获取）
      const demoUserId = new mongoose.Types.ObjectId()
      
      // 插入示例Codegen
      const demoCodegen = await Codegen.create({
        title: '示例按钮组件',
        description: '一个简单的可点击按钮组件',
        userId: demoUserId,
        status: 'completed',
        prompt: [{
          type: 'text',
          content: '创建一个现代化的按钮组件，支持不同尺寸和颜色'
        }],
        workflow: {
          designPhase: {
            componentName: 'ModernButton',
            componentDescription: '现代化的按钮组件，支持多种样式',
            selectedLibraries: ['antd'],
            retrievedKnowledge: 'Button组件最佳实践...'
          },
          generatePhase: {
            generatedCode: `import React from 'react';
import { Button } from 'antd';

interface ModernButtonProps {
  children: React.ReactNode;
  type?: 'primary' | 'default' | 'dashed';
  size?: 'small' | 'middle' | 'large';
  onClick?: () => void;
}

const ModernButton: React.FC<ModernButtonProps> = ({ 
  children, 
  type = 'primary', 
  size = 'middle', 
  onClick 
}) => {
  return (
    <Button type={type} size={size} onClick={onClick}>
      {children}
    </Button>
  );
};

export default ModernButton;`,
            aiModel: 'gpt-4',
            ragContext: 'React组件开发最佳实践...'
          }
        },
        currentVersion: 1
      })

      // 插入对应的ComponentVersion
      await ComponentVersion.create({
        codegenId: demoCodegen._id,
        version: 1,
        code: demoCodegen.workflow.generatePhase!.generatedCode,
        prompt: '创建一个现代化的按钮组件，支持不同尺寸和颜色',
        aiModel: 'gpt-4',
        ragContext: 'React组件开发最佳实践...'
      })

      console.log('✅ 示例数据插入成功')
    } else {
      console.log('ℹ️  数据库已包含数据，跳过初始数据插入')
    }
  } catch (error) {
    console.error('❌ 初始数据插入失败:', error)
  }
}

/**
 * 验证集合创建结果
 */
async function validateCollections() {
  console.log('🔄 验证集合创建结果...')
  
  try {
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    // 获取所有集合
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('📋 当前数据库集合:', collectionNames)
    
    // 验证必要集合是否存在
    const requiredCollections = ['codegens', 'componentversions']
    for (const collectionName of requiredCollections) {
      if (collectionNames.includes(collectionName)) {
        console.log(`✅ ${collectionName} 集合存在`)
        
        // 获取集合统计信息
        try {
          const stats = await db.command({ collStats: collectionName })
          console.log(`   - 文档数量: ${stats.count}`)
          console.log(`   - 索引数量: ${stats.nindexes}`)
          console.log(`   - 存储大小: ${(stats.size / 1024).toFixed(2)} KB`)
        } catch (error) {
          // 如果 collStats 失败，使用基本的计数方法
          const count = await db.collection(collectionName).countDocuments()
          console.log(`   - 文档数量: ${count}`)
          console.log(`   - 统计信息获取失败: ${(error as Error).message}`)
        }
      } else {
        console.log(`❌ ${collectionName} 集合不存在`)
      }
    }

    // 验证索引
    const codegenIndexes = await Codegen.collection.getIndexes()
    const versionIndexes = await ComponentVersion.collection.getIndexes()
    
    console.log('📊 Codegen集合索引:', Object.keys(codegenIndexes))
    console.log('📊 ComponentVersion集合索引:', Object.keys(versionIndexes))
    
  } catch (error) {
    console.error('❌ 集合验证失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
}

export { initDatabase } 