import mongoose from 'mongoose'

export interface ICodegen {
  _id: string
  title: string
  description: string
  userId: string
  status: 'pending' | 'designing' | 'generating' | 'completed' | 'failed'
  prompt: Array<{
    type: 'text' | 'image'
    content: string
  }>
  workflow: {
    designPhase?: {
      componentName: string
      componentDescription: string
      selectedLibraries: string[]
      retrievedKnowledge?: string
    }
    generatePhase?: {
      generatedCode: string
      aiModel: string
      ragContext: string
    }
  }
  currentVersion: number
  createdAt: Date
  updatedAt: Date
}

const CodegenSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'designing', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  prompt: [{
    type: { type: String, enum: ['text', 'image'] },
    content: String
  }],
  workflow: {
    designPhase: {
      componentName: String,
      componentDescription: String,
      selectedLibraries: [String],
      retrievedKnowledge: String
    },
    generatePhase: {
      generatedCode: String,
      aiModel: String,
      ragContext: String
    }
  },
  currentVersion: { type: Number, default: 1 }
}, {
  timestamps: true
})

export default mongoose.models.Codegen || mongoose.model<ICodegen>('Codegen', CodegenSchema)