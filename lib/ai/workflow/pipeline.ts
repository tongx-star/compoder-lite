// lib/ai/workflow/pipeline.ts
import { WorkflowContext } from './types'

// 工作流步骤类型
export type WorkflowStep = (context: WorkflowContext) => Promise<WorkflowContext>

/**
 * 管道函数：将多个工作流步骤串联起来
 * @param steps 工作流步骤数组
 * @returns 串联后的工作流函数
 */
export function pipe(...steps: WorkflowStep[]): WorkflowStep {
  return async (initialContext: WorkflowContext): Promise<WorkflowContext> => {
    return steps.reduce(
      async (promise, step) => step(await promise),
      Promise.resolve(initialContext)
    )
  }
}

/**
 * 错误处理装饰器：为工作流步骤添加错误处理
 * @param step 工作流步骤
 * @returns 包装后的工作流步骤
 */
export function withErrorHandling(step: WorkflowStep): WorkflowStep {
  return async (context: WorkflowContext): Promise<WorkflowContext> => {
    try {
      return await step(context)
    } catch (error) {
      console.error(`工作流步骤执行失败:`, error)
      
      // 向客户端发送错误信息
      context.stream.write(`执行出错: ${error instanceof Error ? error.message : '未知错误'}\n`)
      
      // 更新状态
      return {
        ...context,
        state: {
          ...context.state,
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    }
  }
}

/**
 * 日志装饰器：为工作流步骤添加日志
 * @param stepName 步骤名称
 * @param step 工作流步骤
 * @returns 包装后的工作流步骤
 */
export function withLogging(stepName: string, step: WorkflowStep): WorkflowStep {
  return async (context: WorkflowContext): Promise<WorkflowContext> => {
    const startTime = Date.now()
    console.log(`[${stepName}] 开始执行`)
    context.stream.write(`🔄 ${stepName} 开始...\n`)

    try {
      const result = await step(context)
      const duration = Date.now() - startTime
      console.log(`[${stepName}] 完成执行 (${duration}ms)`)
      context.stream.write(`✅ ${stepName} 完成 (${duration}ms)\n\n`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${stepName}] 执行失败 (${duration}ms):`, error)
      context.stream.write(`❌ ${stepName} 失败 (${duration}ms)\n`)
      throw error
    }
  }
}

/**
 * 超时处理装饰器：为工作流步骤添加超时控制
 * @param timeout 超时时间（毫秒）
 * @param step 工作流步骤
 * @returns 包装后的工作流步骤
 */
export function withTimeout(timeout: number, step: WorkflowStep): WorkflowStep {
  return async (context: WorkflowContext): Promise<WorkflowContext> => {
    return Promise.race([
      step(context),
      new Promise<WorkflowContext>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`步骤执行超时 (${timeout}ms)`))
        }, timeout)
      })
    ])
  }
}

/**
 * 重试装饰器：为工作流步骤添加重试机制
 * @param maxRetries 最大重试次数
 * @param step 工作流步骤
 * @returns 包装后的工作流步骤
 */
export function withRetry(maxRetries: number, step: WorkflowStep): WorkflowStep {
  return async (context: WorkflowContext): Promise<WorkflowContext> => {
    let lastError: Error | undefined
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await step(context)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (i < maxRetries - 1) {
          console.log(`重试第 ${i + 1} 次...`)
          context.stream.write(`🔄 重试第 ${i + 1} 次...\n`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // 指数退避
        }
      }
    }
    
    throw lastError || new Error('重试失败')
  }
}

/**
 * 创建工作流实例
 * @param steps 工作流步骤
 * @returns 工作流函数
 */
export function createWorkflow(...steps: WorkflowStep[]): WorkflowStep {
  return pipe(...steps.map(step => 
    withErrorHandling(
      withLogging(step.name || '未命名步骤', step)
    )
  ))
}

// 使用示例：
/*
const workflow = createWorkflow(
  designComponent,
  generateCode,
  saveComponent
)

// 或者带超时和重试的工作流
const workflowWithRetry = createWorkflow(
  withTimeout(30000, withRetry(3, designComponent)),
  withTimeout(60000, withRetry(2, generateCode)),
  withRetry(3, saveComponent)
)
*/