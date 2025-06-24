import jwt from 'jsonwebtoken'
import User from '@/lib/db/models/User'
import connectDB from '@/lib/db/connection'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Mock GitHub 用户数据
const MOCK_GITHUB_USERS = [
  {
    id: '1',
    login: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
  },
  {
    id: '2', 
    login: 'test-dev',
    name: 'Test Developer',
    email: 'test@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4'
  }
]

export interface MockGitHubUser {
  id: string
  login: string
  name: string
  email: string
  avatar_url: string
}

interface AuthResult {
  user: {
    _id: string
    email: string
    name: string
    avatar: string
    githubId: string
  }
  token: string
}

// 模拟 GitHub OAuth 授权
export async function mockGitHubAuth(username: string): Promise<AuthResult | null> {
  const githubUser = MOCK_GITHUB_USERS.find(u => u.login === username)
  if (!githubUser) return null

  await connectDB()

  // 查找或创建用户
  let user = await User.findOne({ githubId: githubUser.id })
  if (!user) {
    user = await User.create({
      email: githubUser.email,
      name: githubUser.name,
      avatar: githubUser.avatar_url,
      githubId: githubUser.id
    })
  }

  // 生成 JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { user, token }
}

// 验证 JWT token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('JWT token 验证失败:', error)
    return null
  }
}

// 真实 GitHub OAuth 预留接口（TODO: 实现真实 GitHub OAuth）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function realGitHubAuth(_code: string) {
  // TODO: 实现真实的 GitHub OAuth 流程
  // 1. 用 code 换取 access_token
  // 2. 用 access_token 获取用户信息
  // 3. 创建或更新用户记录
  throw new Error('真实 GitHub OAuth 待实现')
}