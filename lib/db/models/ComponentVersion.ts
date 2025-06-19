import mongoose from 'mongoose'

export interface IComponentVersion {
  _id: string
  codegenId: string
  version: number
  code: string
  prompt: string
  aiModel: string
  ragContext?: string
  createdAt: Date
}

const ComponentVersionSchema = new mongoose.Schema({
  codegenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Codegen', required: true },
  version: { type: Number, required: true },
  code: { type: String, required: true },
  prompt: { type: String, required: true },
  aiModel: { type: String, required: true },
  ragContext: { type: String }
}, {
  timestamps: true
})

export default mongoose.models.ComponentVersion || mongoose.model<IComponentVersion>('ComponentVersion', ComponentVersionSchema)