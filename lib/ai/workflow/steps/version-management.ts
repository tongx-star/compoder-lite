import connectDB from '@/lib/db/connection'
import ComponentVersion from '@/lib/db/models/ComponentVersion'

export interface SaveCodeVersionParams {
  codegenId: string
  version: number
  code: string
  prompt: string
  aiModel: string
  ragContext: string
}

export async function saveCodeVersion(params: SaveCodeVersionParams): Promise<void> {
  const {
    codegenId,
    version,
    code,
    prompt,
    aiModel,
    ragContext
  } = params

  try {
    await connectDB()

    const componentVersion = new ComponentVersion({
      codegenId,
      version,
      code,
      prompt,
      aiModel,
      ragContext
    })

    await componentVersion.save()
  } catch (error) {
    console.error('保存代码版本失败:', error)
    throw new Error('保存代码版本失败')
  }
} 