import mongoose from 'mongoose'

export interface IUser {
  _id: string
  email: string
  name: string
  avatar?: string
  githubId?: string  // 预留 GitHub OAuth
  accessToken?: string  // 预留访问令牌
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { type: String },
  githubId: { type: String, unique: true, sparse: true },
  accessToken: { type: String },
}, {
  timestamps: true
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)