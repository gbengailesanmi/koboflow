import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const credentialsId = searchParams.get('credentialsId') || searchParams.get('credentials_id')

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
    }

    // Get the auth token from cookies (note: cookie name is 'auth-token')
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      console.error('No auth-token cookie found. Available cookies:', cookieStore.getAll().map(c => c.name))
      return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
    }

    // Decode the JWT to get the customerId
    let customerId: string | null = null
    try {
      const decoded = jwt.decode(authToken) as { customerId?: string }
      customerId = decoded?.customerId || null
    } catch (err) {
      console.error('Failed to decode JWT:', err)
    }

    if (!customerId) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const backendResponse = await fetch(
      `${backendUrl}/api/callback?code=${code}${credentialsId ? `&credentialsId=${credentialsId}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `auth-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('Backend callback error:', data)
      return NextResponse.redirect(
        new URL(`/${customerId}/dashboard?error=import_failed`, request.url)
      )
    }

    // Success! Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(`/${customerId}/dashboard?import=success&accounts=${data.accountsCount}&transactions=${data.transactionsCount}`, request.url)
    )
  } catch (error) {
    console.error('Callback proxy error:', error)
    
    // Try to get customerId for redirect
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value
    let customerId: string | null = null
    
    if (authToken) {
      try {
        const decoded = jwt.decode(authToken) as { customerId?: string }
        customerId = decoded?.customerId || null
      } catch {}
    }
    
    const redirectUrl = customerId 
      ? `/${customerId}/dashboard?error=callback_failed`
      : '/login?error=callback_failed'
    
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
}
