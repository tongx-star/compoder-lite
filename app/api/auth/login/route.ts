import { NextRequest, NextResponse } from 'next/server'
import { mockGitHubAuth } from '@/lib/auth/mock-github'

export async function POST(req: NextRequest) {
  try {
    const { username, useRealGitHub = false } = await req.json()

    if (useRealGitHub) {
      // TODO: 实现真实 GitHub OAuth
      return NextResponse.json({ error: '真实 GitHub OAuth 待实现' }, { status: 501 })
    }

    // 使用 Mock GitHub OAuth
    const result = await mockGitHubAuth(username)
    if (!result) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 })
    }

    const response = NextResponse.json({
      user: result.user,
      message: '登录成功'
    })

    // 设置 HTTP-only cookie
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 天
    })

    return response
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}