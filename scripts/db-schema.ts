import * as fs from 'fs'
import * as path from 'path'
import mongoose from 'mongoose'

// 读取环境变量
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  envLines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=')
      }
    }
  })
}

async function analyzeSchema(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    console.error('❌ 未找到 MONGODB_URI 环境变量')
    console.log('💡 请确保 .env.local 文件中包含 MONGODB_URI')
    return
  }

  console.log('🔗 正在连接数据库...')
  
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    
    console.log('✅ 数据库连接成功\n')
    
    const db = connection.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    const collections = await db.listCollections().toArray()
    
    console.log('🗄️  数据库结构分析报告')
    console.log('=' .repeat(70))
    console.log(`📊 数据库名称: ${db.databaseName}`)
    console.log(`📋 总集合数: ${collections.length}`)
    console.log(`🕐 分析时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('=' .repeat(70))
    console.log('')

    for (const collectionMeta of collections) {
      const collection = db.collection(collectionMeta.name)
      const count = await collection.countDocuments()
      
      console.log(`📁 集合: ${collectionMeta.name}`)
      console.log(`   📊 文档数量: ${count.toLocaleString()}`)
      
      // 获取索引
      const indexes = await collection.indexes()
      console.log(`   🔍 索引信息 (${indexes.length}个):`)
      indexes.forEach(idx => {
        const keys = Object.keys(idx.key)
          .map(k => `${k}:${idx.key[k]}`)
          .join(', ')
        const unique = idx.unique ? ' [唯一]' : ''
        const sparse = idx.sparse ? ' [稀疏]' : ''
        console.log(`      • ${idx.name || '未命名'} (${keys})${unique}${sparse}`)
      })
      
      // 分析字段结构
      if (count > 0) {
        console.log(`   📝 字段结构分析:`)
        
        // 获取多个样本进行分析
        const sampleSize = Math.min(count, 100)
        const samples = await collection.find({}).limit(sampleSize).toArray()
        
        const fieldTypes: Record<string, Set<string>> = {}
        const fieldStats: Record<string, { count: number; nullCount: number }> = {}
        
        samples.forEach(doc => {
          Object.keys(doc).forEach(field => {
            if (!fieldTypes[field]) {
              fieldTypes[field] = new Set()
              fieldStats[field] = { count: 0, nullCount: 0 }
            }
            
            fieldStats[field].count++
            
            const value = doc[field]
            if (value === null || value === undefined) {
              fieldTypes[field].add('null')
              fieldStats[field].nullCount++
            } else if (Array.isArray(value)) {
              if (value.length > 0) {
                fieldTypes[field].add(`Array<${typeof value[0]}>`)
              } else {
                fieldTypes[field].add('Array<unknown>')
              }
            } else if (value && typeof value === 'object' && value.constructor.name === 'ObjectId') {
              fieldTypes[field].add('ObjectId')
            } else if (value instanceof Date) {
              fieldTypes[field].add('Date')
            } else if (typeof value === 'object') {
              fieldTypes[field].add('Object')
            } else {
              fieldTypes[field].add(typeof value)
            }
          })
        })
        
        // 显示字段统计
        Object.entries(fieldTypes).forEach(([field, types]) => {
          const stats = fieldStats[field]
          const typeList = Array.from(types).join(' | ')
          const presence = `${stats.count}/${sampleSize}`
          const nullInfo = stats.nullCount > 0 ? ` (${stats.nullCount}个空值)` : ''
          console.log(`      ${field}: ${typeList} [出现率: ${presence}]${nullInfo}`)
        })
        
        // 显示样本文档
        console.log(`   📄 样本文档:`)
        const sampleDoc = samples[0]
        const docString = JSON.stringify(sampleDoc, (key, value) => {
          if (value && typeof value === 'object' && value.constructor.name === 'ObjectId') {
            return `ObjectId("${value.toString()}")`
          }
          return value
        }, 2)
        
        const lines = docString.split('\n')
        const preview = lines.slice(0, 10).map(line => `      ${line}`).join('\n')
        console.log(preview)
        if (lines.length > 10) {
          console.log(`      ... (还有 ${lines.length - 10} 行)`)
        }
        
        // 数据库统计信息
        if (count > 1) {
          try {
            const stats = await db.command({ collStats: collectionMeta.name })
            console.log(`   📈 存储统计:`)
            console.log(`      存储大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
            console.log(`      平均文档大小: ${(stats.avgObjSize / 1024).toFixed(2)} KB`)
            if (stats.totalIndexSize) {
              console.log(`      索引大小: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`)
            }
          } catch (statError) {
            // 如果统计信息获取失败，跳过此部分
            console.log(`   📈 存储统计: 无法获取详细统计`)
          }
        }
      }
      
      console.log('') // 空行分隔
    }
    
    console.log('─'.repeat(70))
    console.log('✅ 数据库结构分析完成')
    
    await connection.connection.close()
    console.log('🔒 数据库连接已关闭')
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 分析失败: ${errorMessage}`)
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.log('\n💡 可能的解决方案:')
      console.log('   1. 检查 MongoDB 服务是否启动')
      console.log('   2. 如果使用本地 MongoDB:')
      console.log('      - macOS: brew services start mongodb-community')
      console.log('      - Windows: net start MongoDB')
      console.log('      - Linux: sudo systemctl start mongod')
      console.log('   3. 检查连接字符串是否正确')
      console.log('   4. 检查网络连接和防火墙设置')
    } else if (errorMessage.includes('authentication failed')) {
      console.log('\n💡 认证失败，请检查:')
      console.log('   1. 用户名和密码是否正确')
      console.log('   2. 数据库用户是否有足够权限')
      console.log('   3. 连接字符串格式是否正确')
    }
    
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  analyzeSchema()
}

export default analyzeSchema 