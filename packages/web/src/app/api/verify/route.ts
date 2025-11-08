import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (data.success) {
      return NextResponse.redirect(new URL('/verify-email?verified=true', request.url))
    } else {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/verify-email?error=failed', request.url))
  }
}
