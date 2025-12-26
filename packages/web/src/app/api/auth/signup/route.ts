import { NextRequest, NextResponse } from 'next/server'
import config from '@/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/signup
 * Proxies signup to backend and forwards Set-Cookie header to browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, passwordConfirm } = body

    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${config.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, passwordConfirm }),
    })

    const data = await response.json()
    const res = NextResponse.json(data, { status: response.status })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      res.headers.set('set-cookie', setCookie)
    }

    return res
  } catch (error: any) {
    console.error('[API] Signup error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Signup failed' },
      { status: 500 }
    )
  }
}