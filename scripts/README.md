# 数据库工具说明

这个目录包含了用于查看和监控 MongoDB 数据库结构的实用工具。

## 📋 可用工具

### 1. 数据库结构分析 (`db-schema.ts`)

快速分析并显示数据库的完整结构信息。

**功能特性：**
- 显示所有集合的详细信息
- 分析字段类型和出现频率
- 显示索引信息
- 提供样本文档
- 计算存储统计信息

**使用方法：**
```bash
# 使用 npm 脚本
npm run db:schema

# 或者直接运行
npx tsx scripts/db-schema.ts
```

**输出示例：**
```
🗄️  数据库结构分析报告
======================================================================
📊 数据库名称: compoder
📋 总集合数: 5
🕐 分析时间: 2025/6/19 11:57:56
======================================================================

📁 集合: users
   📊 文档数量: 1
   🔍 索引信息 (1个):
      • _id_ (_id:1)
   📝 字段结构分析:
      _id: ObjectId [出现率: 1/1]
      name: string [出现率: 1/1]
      email: string [出现率: 1/1]
   📄 样本文档:
      {
        "_id": "684bda61692dd198bb9baaf4",
        "name": "Demo User",
        "email": "demo@example.com"
      }
```

### 2. 实时数据库监控 (`db-monitor.ts`)

实时监控数据库结构变化，适合开发调试时使用。

**功能特性：**
- 实时显示集合状态
- 自动刷新（默认5秒）
- 支持手动刷新（按 Enter）
- 简洁的概览格式
- 显示文档数量和存储大小变化

**使用方法：**
```bash
# 使用默认5秒刷新间隔
npm run db:monitor

# 使用2秒快速刷新
npm run db:monitor:fast

# 自定义刷新间隔（例如10秒）
npx tsx scripts/db-monitor.ts --interval=10
```

**操作说明：**
- `Enter` - 立即刷新
- `Ctrl+C` - 退出监控

**输出示例：**
```
🗄️  MongoDB 数据库实时监控
============================================================
📊 数据库名称: compoder
🕐 更新时间: 2025/6/19 12:00:00
🔄 刷新间隔: 5秒
============================================================
📋 总集合数: 5

📁 users
   📊 文档: 1 | 大小: 0.01 MB
   🔍 索引: 1个
   📝 字段: _id, name, email, image, emailVerified

📁 codegens
   📊 文档: 6 | 大小: 0.21 MB
   🔍 索引: 1个
   📝 字段: _id, title, description, fullStack, guides...
```

## 🔧 环境要求

确保项目根目录下有 `.env.local` 文件，包含：
```env
MONGODB_URI=mongodb://localhost:27017/compoder
# 或者 MongoDB Atlas 连接字符串
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/compoder
```

## 📝 使用场景

### 开发阶段
- 使用 `npm run db:schema` 了解数据库整体结构
- 使用 `npm run db:monitor` 实时观察数据变化

### 调试阶段
- 使用 `npm run db:monitor:fast` 快速监控数据库操作
- 检查索引是否正确创建
- 验证数据写入是否成功

### 数据库维护
- 定期运行 `npm run db:schema` 生成结构报告
- 监控存储空间使用情况
- 检查字段类型一致性

## ⚠️ 注意事项

1. **性能影响**：监控工具会定期查询数据库，在生产环境中请谨慎使用
2. **连接限制**：确保数据库连接池有足够的可用连接
3. **权限要求**：需要数据库读取权限和 `listCollections` 权限
4. **大数据库**：对于大型数据库，分析可能需要较长时间

## 🚀 扩展功能

这些工具可以轻松扩展以支持：
- 数据库性能监控
- 查询执行计划分析
- 索引使用统计
- 数据变更历史记录
- 自动报警功能

## 🔗 相关链接

- [MongoDB 官方文档](https://docs.mongodb.com/)
- [Mongoose 文档](https://mongoosejs.com/docs/)
- [Node.js MongoDB 驱动](https://mongodb.github.io/node-mongodb-native/) 