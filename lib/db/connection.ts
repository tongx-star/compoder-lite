import mongoose from 'mongoose'

// 缓存连接对象的类型
interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// 扩展global类型定义
declare global {
  var mongoose: CachedConnection | undefined
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('请在 .env.local 中配置 MONGODB_URI')
}

// cached对象本身不会被重新赋值，只是它的属性会被修改
const cached: CachedConnection = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB(): Promise<typeof mongoose> {
  // 如果已有连接且连接状态正常，直接返回
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // 连接超时设置
      serverSelectionTimeoutMS: 5000, // 5秒超时
      socketTimeoutMS: 45000, // 45秒套接字超时
      // 连接池设置
      maxPoolSize: 10, // 最大连接池大小
      minPoolSize: 5,  // 最小连接池大小
      // 自动重连
      retryWrites: true,
      // 读写关注 - 使用正确的类型
      writeConcern: {
        w: 'majority' as const,
      },
    }

    console.log('正在连接 MongoDB...')
    
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB 连接成功')
      
      // 监听连接事件
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB 连接错误:', error)
      })
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB 断开连接')
      })
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB 重新连接成功')
      })
      
      return mongooseInstance
    }).catch((error) => {
      console.error('❌ MongoDB 连接失败:', error)
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    console.error('❌ 连接 MongoDB 时发生错误:', error)
    throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 优雅关闭数据库连接
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.connection.close()
    cached.conn = null
    cached.promise = null
    console.log('🔒 MongoDB 连接已关闭')
  }
}

export default connectDB