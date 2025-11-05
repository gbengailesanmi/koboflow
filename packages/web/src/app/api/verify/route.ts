import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  // Get token from URL on SERVER side (never sent to client)
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    // Redirect to verify-email page without token
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
    console.log('[VERIFY API] Backend response:', { success: data.success, message: data.message })

    if (data.success) {
      // Redirect to verify-email page with success flag
      console.log('[VERIFY API] Redirecting to /verify-email?verified=true')
      return NextResponse.redirect(new URL('/verify-email?verified=true', request.url))
    } else {
      // Redirect to verify-email with error
      console.log('[VERIFY API] Redirecting to /verify-email?error=invalid')
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }
  } catch (error) {
    console.error('[VERIFY API] Verification error:', error)
    // Redirect to verify-email with error
    return NextResponse.redirect(new URL('/verify-email?error=failed', request.url))
  }
}
