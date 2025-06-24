import { WorkflowContext } from '../types'
import { knowledgeManager } from '@/lib/ai/rag/knowledge-manager'
import { generateCodeStream } from '@/lib/ai/workflow/steps/code-generation'
import { saveCodeVersion } from '@/lib/ai/workflow/steps/version-management'
import connectDB from '@/lib/db/connection'
import Codegen from '@/lib/db/models/Codegen'

// 步骤1: 需求分析和设计阶段
export async function designPhaseStep(context: WorkflowContext): Promise<WorkflowContext> {
  context.stream.write('🎨 开始设计分析阶段...\n')

  const { prompt, selectedLibraries } = context.query
  const promptText = prompt.find(p => p.type === 'text')?.content || ''

  // 1. 分析用户需求，提取组件信息
  const componentAnalysis = await analyzeComponentRequirements(promptText)
  context.stream.write(`✅ 组件分析完成: ${componentAnalysis.componentName}\n`)

  // 2. 从知识库检索相关信息
  const knowledgeResults = await knowledgeManager.search(
    `${componentAnalysis.componentName} ${componentAnalysis.keywords.join(' ')}`,
    selectedLibraries === 'custom' ? 'all' : selectedLibraries,
    3
  )

  context.stream.write(`✅ 知识检索完成，找到 ${knowledgeResults.length} 个相关文档\n`)

  // 3. 更新上下文状态
  context.state = {
    ...context.state,
    designPhase: {
      componentName: componentAnalysis.componentName,
      componentDescription: componentAnalysis.description,
      selectedLibraries: [selectedLibraries],
      retrievedKnowledge: knowledgeResults.map(r => r.chunk.content).join('\n\n')
    }
  }

  return context
}

// 步骤2: 代码生成阶段 - 修改为流式输出
export async function codeGenerationStep(context: WorkflowContext): Promise<WorkflowContext> {
  context.stream.write('🚀 开始代码生成阶段...\n')

  if (!context.state?.designPhase) {
    throw new Error('设计阶段数据缺失')
  }

  const { prompt } = context.query
  const { designPhase } = context.state
  const promptText = prompt.find(p => p.type === 'text')?.content || ''

  // 构建增强的提示词
  const enhancedPrompt = buildEnhancedPrompt(
    promptText,
    designPhase.retrievedKnowledge || '',
    designPhase.selectedLibraries[0]
  )

  context.stream.write('🤖 开始流式生成代码...\n')
  
  // 通知前端开始代码流式输出
  context.stream.startCode()

  try {
    // 使用流式代码生成
    const generatedCode = await generateCodeStream(
      enhancedPrompt,
      designPhase.selectedLibraries[0],
      (chunk: string) => {
        // 实时输出代码片段
        context.stream.writeCode(chunk)
      }
    )

    // 通知前端代码生成完成
    context.stream.endCode()
    context.stream.write('✅ 代码生成完成\n')

    // 更新上下文状态
    context.state.generatePhase = {
      generatedCode,
      aiModel: 'deepseek-coder',
      ragContext: designPhase.retrievedKnowledge || ''
    }
  } catch (error) {
    context.stream.error(`代码生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    throw error
  }

  return context
}

// 步骤3: 存储和版本管理阶段
export async function saveVersionStep(context: WorkflowContext): Promise<WorkflowContext> {
  context.stream.write('💾 保存代码版本...\n')

  if (!context.state?.generatePhase) {
    throw new Error('代码生成阶段数据缺失')
  }

  try {
    await connectDB()

    // 更新 Codegen 记录
    const updatedCodegen = await Codegen.findByIdAndUpdate(
      context.query.codegenId,
      {
        status: 'completed',
        workflow: context.state,
        $inc: { currentVersion: 1 }
      },
      { new: true }
    )

    if (!updatedCodegen) {
      throw new Error('更新 Codegen 记录失败')
    }

    // 保存版本历史
    await saveCodeVersion({
      codegenId: context.query.codegenId,
      version: updatedCodegen.currentVersion,
      code: context.state.generatePhase.generatedCode,
      prompt: context.query.prompt.map(p => p.content).join('\n'),
      aiModel: context.state.generatePhase.aiModel,
      ragContext: context.state.generatePhase.ragContext
    })

    context.stream.write('✅ 版本保存完成\n')
  } catch (error) {
    context.stream.error(`版本保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    throw error
  }

  return context
}

// 辅助函数：分析组件需求
async function analyzeComponentRequirements(prompt: string): Promise<{
  componentName: string
  description: string
  keywords: string[]
  complexity: 'basic' | 'intermediate' | 'advanced'
}> {
  // 简化版需求分析，实际项目中可以使用更复杂的NLP处理
  const keywords = extractKeywords(prompt)

  // 尝试从提示词中提取组件名称
  const componentNameMatch = prompt.match(/(?:创建|生成|制作)\s*([a-zA-Z]\w*)\s*(?:组件|Component)/i)
  const componentName = componentNameMatch?.[1] || guessComponentType(keywords)

  return {
    componentName,
    description: prompt.slice(0, 200), // 截取前200字符作为描述
    keywords,
    complexity: guessComplexity(prompt)
  }
}

function extractKeywords(text: string): string[] {
  const commonKeywords = [
    'button', 'form', 'input', 'table', 'card', 'modal', 'dropdown',
    'menu', 'navigation', 'sidebar', 'header', 'footer', 'layout',
    'chart', 'graph', 'list', 'grid', 'carousel', 'tabs', 'accordion'
  ]

  return commonKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword)
  )
}

function guessComponentType(keywords: string[]): string {
  if (keywords.includes('button')) return 'Button'
  if (keywords.includes('form')) return 'Form'
  if (keywords.includes('table')) return 'Table'
  if (keywords.includes('card')) return 'Card'
  if (keywords.includes('modal')) return 'Modal'
  return 'Component'
}

function guessComplexity(prompt: string): 'basic' | 'intermediate' | 'advanced' {
  const advancedKeywords = ['复杂', '高级', '动画', '交互', '状态管理']
  const intermediateKeywords = ['表单验证', '数据处理', '事件处理']

  if (advancedKeywords.some(kw => prompt.includes(kw))) return 'advanced'
  if (intermediateKeywords.some(kw => prompt.includes(kw))) return 'intermediate'
  return 'basic'
}

// 构建增强提示词
function buildEnhancedPrompt(
  userPrompt: string,
  knowledgeContext: string,
  library: string
): string {
  return `
你是一个专业的前端开发工程师，请根据以下要求生成高质量的 React 组件代码。

用户需求：
${userPrompt}

技术栈要求：
- 使用 ${library === 'antd' ? 'Ant Design' : library === 'shadcn' ? 'Shadcn UI' : '自定义'} 组件库
- 使用 TypeScript
- 使用 React Hooks
- 遵循最佳实践

相关知识库信息：
${knowledgeContext}

请生成完整的组件代码，包括：
1. 必要的 import 语句
2. TypeScript 接口定义
3. 主要组件实现
4. 适当的注释说明
5. 基本的样式处理

要求：
- 代码结构清晰，易于理解
- 遵循组件库的设计规范
- 考虑可访问性和用户体验
- 提供合理的默认值和错误处理
`
}
