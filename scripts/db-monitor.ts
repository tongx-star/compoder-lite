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

interface CollectionInfo {
  name: string
  count: number
  indexes: string[]
  sampleDocument: Record<string, unknown> | null
  schema: Record<string, string>
  size?: string
}

class DatabaseMonitor {
  private connection: typeof mongoose | null = null
  private isRunning = false
  private refreshInterval = 5 // 秒

  async connect(): Promise<void> {
    if (!process.env.MONGODB_URI) {
      throw new Error('未找到 MONGODB_URI 环境变量')
    }

    console.log('🔗 正在连接数据库...')
    this.connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ 数据库连接成功\n')
  }

  async getCollectionInfo(collectionName: string): Promise<CollectionInfo> {
    if (!this.connection) throw new Error('数据库未连接')
    
    const db = this.connection.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    const collection = db.collection(collectionName)
    
    // 获取文档数量
    const count = await collection.countDocuments()
    
    // 获取索引信息
    const indexInfo = await collection.indexes()
    const indexes = indexInfo.map(idx => {
      const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ')
      const unique = idx.unique ? ' [唯一]' : ''
      const sparse = idx.sparse ? ' [稀疏]' : ''
      return `${idx.name || 'unnamed'} (${keys})${unique}${sparse}`
    })
    
    // 获取样本文档和字段结构
    let sampleDocument: Record<string, unknown> | null = null
    let schema: Record<string, string> = {}
    let size: string | undefined
    
    if (count > 0) {
      const sample = await collection.findOne()
      if (sample) {
        sampleDocument = sample
        schema = this.analyzeDocumentStructure(sample)
      }
      
      // 获取集合大小信息
      try {
        const stats = await db.command({ collStats: collectionName })
        size = `${(stats.size / 1024 / 1024).toFixed(2)} MB`
      } catch {
        size = '无法获取'
      }
    }
    
    return {
      name: collectionName,
      count,
      indexes,
      sampleDocument,
      schema,
      size
    }
  }

  private analyzeDocumentStructure(doc: Record<string, unknown>): Record<string, string> {
    const schema: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(doc)) {
      if (value === null) {
        schema[key] = 'null'
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          const firstItem = value[0]
          schema[key] = `Array<${typeof firstItem}>`
        } else {
          schema[key] = 'Array<unknown>'
        }
      } else if (typeof value === 'object' && value.constructor.name === 'ObjectId') {
        schema[key] = 'ObjectId'
      } else if (value instanceof Date) {
        schema[key] = 'Date'
      } else if (typeof value === 'object') {
        schema[key] = 'Object'
      } else {
        schema[key] = typeof value
      }
    }
    
    return schema
  }

  async displayDatabaseStructure(): Promise<void> {
    if (!this.connection) throw new Error('数据库未连接')
    
    const db = this.connection.connection.db
    if (!db) {
      throw new Error('数据库连接失败')
    }
    
    // 清屏
    console.clear()
    
    console.log('🗄️  MongoDB 数据库实时监控')
    console.log('=' .repeat(60))
    console.log(`📊 数据库名称: ${db.databaseName}`)
    console.log(`🕐 更新时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log(`🔄 刷新间隔: ${this.refreshInterval}秒`)
    console.log('=' .repeat(60))
    
    try {
      // 获取所有集合
      const collections = await db.listCollections().toArray()
      console.log(`📋 总集合数: ${collections.length}\n`)
      
      for (const collectionMeta of collections) {
        const collectionInfo = await this.getCollectionInfo(collectionMeta.name)
        
        console.log(`📁 ${collectionInfo.name}`)
        console.log(`   📊 文档: ${collectionInfo.count} | 大小: ${collectionInfo.size || '未知'}`)
        
        // 显示索引（简化）
        console.log(`   🔍 索引: ${collectionInfo.indexes.length}个`)
        
        // 显示主要字段
        if (Object.keys(collectionInfo.schema).length > 0) {
          const fields = Object.keys(collectionInfo.schema).slice(0, 5) // 只显示前5个字段
          const fieldList = fields.join(', ')
          const moreFields = Object.keys(collectionInfo.schema).length > 5 ? '...' : ''
          console.log(`   📝 字段: ${fieldList}${moreFields}`)
        }
        
        console.log('') // 空行
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error(`❌ 获取数据库结构失败: ${errorMessage}`)
    }
    
    console.log('─'.repeat(60))
    console.log('💡 提示: 按 Ctrl+C 停止监控 | 按 Enter 立即刷新')
    console.log(`🔄 下次刷新: ${this.refreshInterval}秒后`)
  }

  async startMonitoring(intervalSeconds: number = 5): Promise<void> {
    this.isRunning = true
    this.refreshInterval = intervalSeconds
    
    // 立即显示一次
    await this.displayDatabaseStructure()
    
    // 设置定时刷新
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval)
        return
      }
      
      try {
        await this.displayDatabaseStructure()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        console.error(`❌ 监控过程中发生错误: ${errorMessage}`)
      }
    }, intervalSeconds * 1000)
    
    // 监听键盘输入
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', async (key) => {
      const keyStr = key.toString()
      
      if (keyStr === '\u0003') { // Ctrl+C
        console.log('\n\n🛑 正在停止监控...')
        this.isRunning = false
        clearInterval(interval)
        await this.disconnect()
        process.exit(0)
      } else if (keyStr === '\r' || keyStr === '\n') { // Enter
        await this.displayDatabaseStructure()
      }
    })
    
    // 处理程序退出
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 正在停止监控...')
      this.isRunning = false
      clearInterval(interval)
      await this.disconnect()
      process.exit(0)
    })
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.connection.close()
      console.log('🔒 数据库连接已关闭')
    }
  }
}

// 主函数
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const intervalArg = args.find(arg => arg.startsWith('--interval='))
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 5

  if (interval < 1 || interval > 60) {
    console.error('❌ 刷新间隔必须在 1-60 秒之间')
    process.exit(1)
  }

  const monitor = new DatabaseMonitor()
  
  try {
    await monitor.connect()
    console.log('🚀 启动实时监控...')
    console.log(`⏱️  刷新间隔: ${interval}秒`)
    console.log('📝 用法: 按 Enter 立即刷新，按 Ctrl+C 退出\n')
    
    await monitor.startMonitoring(interval)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 启动监控失败: ${errorMessage}`)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export default DatabaseMonitor 