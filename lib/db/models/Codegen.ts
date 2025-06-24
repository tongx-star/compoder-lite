import mongoose from 'mongoose'

/**
 * 代码生成任务接口定义
 * 描述了AI代码生成工作流中的核心数据结构
 */
export interface ICodegen {
  /** 文档唯一标识符 */
  _id: string
  
  /** 任务标题 */
  title: string
  
  /** 任务描述 */
  description: string
  
  /** 创建任务的用户ID，关联到User模型 */
  userId: string
  
  /** 
   * 任务执行状态
   * - pending: 等待处理
   * - designing: 设计阶段（分析需求、组件设计）
   * - generating: 生成阶段（AI代码生成）
   * - completed: 已完成
   * - failed: 执行失败
   */
  status: 'pending' | 'designing' | 'generating' | 'completed' | 'failed'
  
  /** 
   * 用户输入的提示信息数组
   * 支持多模态输入（文本和图片）
   */
  prompt: Array<{
    /** 提示类型：文本或图片 */
    type: 'text' | 'image'
    /** 提示内容：文本内容或图片URL/base64 */
    content: string
  }>
  
  /** 
   * 工作流执行过程中的状态数据
   * 记录设计阶段和生成阶段的详细信息
   */
  workflow: {
    /** 设计阶段数据（可选） */
    designPhase?: {
      /** 生成的组件名称 */
      componentName: string
      /** 组件功能描述 */
      componentDescription: string
      /** 选择使用的UI库列表 */
      selectedLibraries: string[]
      /** RAG系统检索到的相关知识（可选） */
      retrievedKnowledge?: string
    }
    /** 生成阶段数据（可选） */
    generatePhase?: {
      /** AI生成的完整代码 */
      generatedCode: string
      /** 使用的AI模型名称 */
      aiModel: string
      /** RAG检索增强生成的上下文信息 */
      ragContext: string
    }
  }
  
  /** 当前版本号，支持版本管理 */
  currentVersion: number
  
  /** 记录创建时间 */
  createdAt: Date
  
  /** 记录最后更新时间 */
  updatedAt: Date
}

/**
 * Mongoose数据库模式定义
 * 定义了代码生成任务在MongoDB中的存储结构
 */
const CodegenSchema = new mongoose.Schema({
  /** 任务标题，必填字段 */
  title: { type: String, required: true },
  
  /** 任务描述，必填字段 */
  description: { type: String, required: true },
  
  /** 用户ID，关联到User集合，必填字段 */
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  /** 
   * 任务状态枚举
   * 默认值为'pending'（等待处理）
   */
  status: { 
    type: String, 
    enum: ['pending', 'designing', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  
  /** 
   * 用户提示信息数组
   * 每个元素包含类型和内容
   */
  prompt: [{
    /** 提示类型：限制为'text'或'image' */
    type: { type: String, enum: ['text', 'image'] },
    /** 提示内容 */
    content: String
  }],
  
  /** 
   * 工作流状态数据
   * 记录整个AI代码生成流程的中间结果
   */
  workflow: {
    /** 设计阶段相关数据 */
    designPhase: {
      /** 组件名称 */
      componentName: String,
      /** 组件描述 */
      componentDescription: String,
      /** 选择的UI库数组 */
      selectedLibraries: [String],
      /** 检索到的知识库内容 */
      retrievedKnowledge: String
    },
    /** 代码生成阶段相关数据 */
    generatePhase: {
      /** 生成的代码内容 */
      generatedCode: String,
      /** 使用的AI模型 */
      aiModel: String,
      /** RAG上下文信息 */
      ragContext: String
    }
  },
  
  /** 版本号，默认为1 */
  currentVersion: { type: Number, default: 1 }
}, {
  /** 自动添加createdAt和updatedAt时间戳 */
  timestamps: true
})

/**
 * 导出Codegen模型
 * 使用已存在的模型或创建新模型，避免重复编译错误
 */
export default mongoose.models.Codegen || mongoose.model<ICodegen>('Codegen', CodegenSchema)