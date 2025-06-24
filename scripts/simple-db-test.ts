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

async function testCompoderLite(): Promise<void> {
  console.log('🔍 测试 compoder-lite 数据库连接...\n')

  if (!process.env.MONGODB_URI) {
    console.error('❌ 未找到 MONGODB_URI 环境变量')
    return
  }

  console.log(`🔗 连接字符串: ${process.env.MONGODB_URI}`)
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
    
    console.log(`📊 当前数据库: ${db.databaseName}`)
    
    // 尝试简单的操作 - 创建一个测试集合
    console.log('\n🧪 执行简单的数据库操作测试...')
    
    const testCollection = db.collection('test')
    
    // 插入一条测试数据
    const testDoc = {
      message: 'Hello compoder-lite!',
      timestamp: new Date(),
      version: '1.0.0'
    }
    
    const insertResult = await testCollection.insertOne(testDoc)
    console.log(`✅ 插入测试文档成功, ID: ${insertResult.insertedId}`)
    
    // 查询测试数据
    const foundDoc = await testCollection.findOne({ message: 'Hello compoder-lite!' })
    console.log('✅ 查询测试文档成功:', foundDoc?.message)
    
    // 统计文档数量
    const count = await testCollection.countDocuments()
    console.log(`✅ 集合文档数量: ${count}`)
    
    // 删除测试数据
    await testCollection.deleteMany({})
    console.log('✅ 清理测试数据完成')
    
    // 创建实际的应用集合
    console.log('\n🏗️  创建应用集合...')
    
    // 创建 users 集合
    const usersCollection = db.collection('users')
    await usersCollection.insertOne({
      name: 'Test User',
      email: 'test@compoder-lite.com',
      role: 'user',
      createdAt: new Date()
    })
    console.log('✅ 创建 users 集合成功')
    
    // 创建 projects 集合  
    const projectsCollection = db.collection('projects')
    await projectsCollection.insertOne({
      title: 'Test Project',
      description: '测试项目',
      createdAt: new Date()
    })
    console.log('✅ 创建 projects 集合成功')
    
    console.log('\n📊 数据库状态:')
    console.log(`   数据库名称: ${db.databaseName}`)
    console.log(`   连接状态: ${connection.connection.readyState === 1 ? '已连接' : '未连接'}`)
    
    await connection.connection.close()
    console.log('\n🔒 数据库连接已关闭')
    console.log('🎉 compoder-lite 数据库设置完成！')
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 测试失败: ${errorMessage}`)
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB 连接被拒绝，可能的解决方案:')
      console.log('1. 检查 MongoDB 服务是否启动:')
      console.log('   - macOS: brew services start mongodb-community')
      console.log('   - Windows: net start MongoDB')  
      console.log('   - Linux: sudo systemctl start mongod')
      console.log('2. 检查端口 27017 是否被占用')
    } else if (errorMessage.includes('authentication')) {
      console.log('\n💡 认证相关问题:')
      console.log('1. 如果 MongoDB 不需要认证，请检查连接字符串')
      console.log('2. 如果需要认证，请添加用户名和密码')
      console.log('3. 尝试连接不需要认证的本地 MongoDB')
    }
    
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testCompoderLite()
}

export default testCompoderLite 