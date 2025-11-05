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
    // Call backend verification endpoint from SERVER
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (data.success) {
      // Redirect to login with success message
      return NextResponse.redirect(new URL('/login?verified=true', request.url))
    } else {
      // Redirect to verify-email with error
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }
  } catch (error) {
    console.error('Verification error:', error)
    // Redirect to verify-email with error
    return NextResponse.redirect(new URL('/verify-email?error=failed', request.url))
  }
}
