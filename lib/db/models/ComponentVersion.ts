import mongoose from 'mongoose'

/**
 * 组件版本接口定义
 * 用于管理AI生成组件的历史版本，支持版本回溯和对比
 */
export interface IComponentVersion {
  /** 文档唯一标识符 */
  _id: string
  
  /** 关联的代码生成任务ID，指向Codegen集合 */
  codegenId: string
  
  /** 版本号，从1开始递增 */
  version: number
  
  /** 该版本生成的完整代码内容 */
  code: string
  
  /** 生成该版本时使用的用户提示 */
  prompt: string
  
  /** 生成该版本时使用的AI模型名称 */
  aiModel: string
  
  /** RAG检索增强生成的上下文信息（可选） */
  ragContext?: string
  
  /** 版本创建时间 */
  createdAt: Date
}

/**
 * Mongoose数据库模式定义
 * 定义了组件版本在MongoDB中的存储结构
 * 支持版本历史追踪和代码演进管理
 */
const ComponentVersionSchema = new mongoose.Schema({
  /** 代码生成任务ID，关联到Codegen集合，必填字段 */
  codegenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Codegen', required: true },
  
  /** 版本号，必填字段，用于版本排序和标识 */
  version: { type: Number, required: true },
  
  /** 代码内容，必填字段，存储完整的组件代码 */
  code: { type: String, required: true },
  
  /** 用户提示，必填字段，记录生成该版本的输入 */
  prompt: { type: String, required: true },
  
  /** AI模型名称，必填字段，用于追踪生成来源 */
  aiModel: { type: String, required: true },
  
  /** RAG上下文信息，可选字段，记录检索到的相关知识 */
  ragContext: { type: String }
}, {
  /** 自动添加createdAt和updatedAt时间戳 */
  timestamps: true
})

/**
 * 导出ComponentVersion模型
 * 使用已存在的模型或创建新模型，避免重复编译错误
 * 
 * 设计目的：
 * - 版本管理：支持组件代码的版本控制
 * - 历史追踪：记录每次生成的完整上下文
 * - 对比分析：便于比较不同版本的差异
 * - 回滚机制：支持回退到之前的版本
 */
export default mongoose.models.ComponentVersion || mongoose.model<IComponentVersion>('ComponentVersion', ComponentVersionSchema)