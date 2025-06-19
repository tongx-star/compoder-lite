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

async function checkAndSwitchDatabase(): Promise<void> {
  console.log('🔍 检查 MongoDB 连接和数据库状态...\n')

  // 检查环境变量
  if (!process.env.MONGODB_URI) {
    console.error('❌ 未找到 MONGODB_URI 环境变量')
    console.log('💡 需要设置 MONGODB_URI 环境变量。请选择以下选项之一：')
    console.log('')
    console.log('1. 创建 .env.local 文件并添加以下内容：')
    console.log('   MONGODB_URI=mongodb://localhost:27017/compoder-lite')
    console.log('')
    console.log('2. 或者使用 MongoDB Atlas 云数据库：')
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/compoder-lite')
    console.log('')
    
    // 提供一个交互式选择
    console.log('🤖 为您创建本地 .env.local 文件吗？')
    await createEnvFile()
    return
  }

  try {
    console.log('🔗 正在连接 MongoDB...')
    
    // 先连接到默认数据库
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    
    console.log('✅ MongoDB 连接成功')
    
    const adminDb = connection.connection.db.admin()
    
    // 列出所有数据库
    console.log('\n📊 当前 MongoDB 实例中的所有数据库：')
    console.log('=' .repeat(50))
    
    const databasesList = await adminDb.listDatabases()
    const databases = databasesList.databases
    
    let hasCompoderLite = false
    
    databases.forEach((database, index) => {
      const sizeInMB = (database.sizeOnDisk / 1024 / 1024).toFixed(2)
      const emoji = database.name === 'compoder-lite' ? '🎯' : '📁'
      console.log(`${emoji} ${index + 1}. ${database.name} (${sizeInMB} MB)`)
      
      if (database.name === 'compoder-lite') {
        hasCompoderLite = true
      }
    })
    
    console.log('=' .repeat(50))
    
    // 检查当前连接的数据库
    const currentDb = connection.connection.db
    console.log(`\n📍 当前连接的数据库: ${currentDb.databaseName}`)
    
    if (currentDb.databaseName === 'compoder-lite') {
      console.log('✅ 已经连接到 compoder-lite 数据库！')
      
      // 显示当前集合
      const collections = await currentDb.listCollections().toArray()
      if (collections.length > 0) {
        console.log(`\n📋 compoder-lite 数据库中的集合 (${collections.length}个):`)
        for (const collection of collections) {
          const collectionRef = currentDb.collection(collection.name)
          const count = await collectionRef.countDocuments()
          console.log(`   📁 ${collection.name} (${count} 个文档)`)
        }
      } else {
        console.log('\n📋 compoder-lite 数据库是空的，没有集合')
      }
    } else {
      console.log(`\n🔄 需要切换到 compoder-lite 数据库`)
      
      if (hasCompoderLite) {
        console.log('✅ compoder-lite 数据库已存在')
        await updateConnectionString()
      } else {
        console.log('📝 compoder-lite 数据库不存在，将为您创建')
        await createDatabase()
      }
    }
    
    await connection.connection.close()
    console.log('\n🔒 数据库连接已关闭')
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 操作失败: ${errorMessage}`)
    
    if (errorMessage.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB 连接被拒绝，可能的解决方案:')
      console.log('1. 检查 MongoDB 服务是否启动:')
      console.log('   - macOS: brew services start mongodb-community')
      console.log('   - Windows: net start MongoDB')
      console.log('   - Linux: sudo systemctl start mongod')
      console.log('2. 检查端口 27017 是否被占用')
      console.log('3. 检查防火墙设置')
    } else if (errorMessage.includes('authentication failed')) {
      console.log('\n💡 认证失败，请检查:')
      console.log('1. 用户名和密码是否正确')
      console.log('2. 数据库用户权限是否足够')
      console.log('3. 连接字符串格式是否正确')
    }
    
    process.exit(1)
  }
}

async function createEnvFile(): Promise<void> {
  const envContent = `# MongoDB 连接字符串
MONGODB_URI=mongodb://localhost:27017/compoder-lite

# 如果使用 MongoDB Atlas，请使用以下格式：
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/compoder-lite

# 其他环境变量...
# NEXTAUTH_SECRET=your-secret-key
# NEXTAUTH_URL=http://localhost:3000
`

  try {
    fs.writeFileSync('.env.local', envContent, 'utf8')
    console.log('✅ 已创建 .env.local 文件')
    console.log('📝 已设置 MONGODB_URI=mongodb://localhost:27017/compoder-lite')
    console.log('\n🔄 请重新运行此脚本以连接到新数据库')
    process.env.MONGODB_URI = 'mongodb://localhost:27017/compoder-lite'
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 创建 .env.local 文件失败: ${errorMessage}`)
    process.exit(1)
  }
}

async function updateConnectionString(): Promise<void> {
  const currentUri = process.env.MONGODB_URI!
  
  // 解析当前连接字符串
  const uriParts = currentUri.split('/')
  const newUri = uriParts.slice(0, -1).join('/') + '/compoder-lite'
  
  console.log(`\n🔄 更新连接字符串:`)
  console.log(`   原来: ${currentUri}`)
  console.log(`   新的: ${newUri}`)
  
  // 更新 .env.local 文件
  try {
    let envContent = ''
    if (fs.existsSync('.env.local')) {
      envContent = fs.readFileSync('.env.local', 'utf8')
      envContent = envContent.replace(/MONGODB_URI=.*/, `MONGODB_URI=${newUri}`)
    } else {
      envContent = `MONGODB_URI=${newUri}\n`
    }
    
    fs.writeFileSync('.env.local', envContent, 'utf8')
    console.log('✅ 已更新 .env.local 文件')
    console.log('💡 请重启应用程序以使用新的数据库连接')
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 更新配置文件失败: ${errorMessage}`)
    console.log('💡 请手动更新 .env.local 文件中的 MONGODB_URI')
  }
}

async function createDatabase(): Promise<void> {
  try {
    const currentUri = process.env.MONGODB_URI!
    const uriParts = currentUri.split('/')
    const newUri = uriParts.slice(0, -1).join('/') + '/compoder-lite'
    
    console.log('\n🏗️  正在创建 compoder-lite 数据库...')
    
    // 连接到新数据库
    const newConnection = await mongoose.createConnection(newUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    
    // 等待连接准备就绪
    await new Promise<void>((resolve, reject) => {
      newConnection.once('connected', resolve)
      newConnection.once('error', reject)
      if (newConnection.readyState === 1) resolve()
    })
    
    const newDb = newConnection.db!
    
    // 创建一个示例集合来初始化数据库
    console.log('📝 创建初始集合...')
    
    // 创建 users 集合
    const usersCollection = newDb.collection('users')
    await usersCollection.insertOne({
      name: 'Demo User',
      email: 'demo@example.com',
      createdAt: new Date(),
      role: 'user'
    })
    
    // 创建 projects 集合
    const projectsCollection = newDb.collection('projects')
    await projectsCollection.insertOne({
      title: 'Welcome Project',
      description: '欢迎使用 compoder-lite 数据库',
      createdAt: new Date(),
      status: 'active'
    })
    
    // 创建 settings 集合
    const settingsCollection = newDb.collection('settings')
    await settingsCollection.insertOne({
      appName: 'Compoder Lite',
      version: '1.0.0',
      createdAt: new Date(),
      config: {
        theme: 'light',
        language: 'zh-CN'
      }
    })
    
    console.log('✅ compoder-lite 数据库创建成功！')
    console.log('\n📋 已创建的集合:')
    console.log('   📁 users (1 个示例文档)')
    console.log('   📁 projects (1 个示例文档)')
    console.log('   📁 settings (1 个示例文档)')
    
    await newConnection.close()
    
    // 更新连接字符串
    await updateConnectionString()
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`❌ 创建数据库失败: ${errorMessage}`)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🚀 MongoDB 数据库切换工具')
  console.log('=' .repeat(50))
  checkAndSwitchDatabase()
}

export default checkAndSwitchDatabase 