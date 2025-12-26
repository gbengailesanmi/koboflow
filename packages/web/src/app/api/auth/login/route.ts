import { NextRequest, NextResponse } from 'next/server'
import config from '@/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 * Proxies login to backend and forwards Set-Cookie header to browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${config.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    const res = NextResponse.json(data, { status: response.status })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      res.headers.set('set-cookie', setCookie)
    }

    return res
  } catch (error: any) {
    console.error('[API] Login error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}