import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, processTinkCallback } from '@/lib/api-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const credentialsId = searchParams.get('credentialsId') || searchParams.get('credentials_id')

    if (!code) {
      console.error('[Callback] Missing OAuth code')
      return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
    }

    // Check if session cookie exists
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session-id')?.value

    if (!sessionId) {
      console.error('[Callback] No session-id cookie found. Available cookies:', cookieStore.getAll().map(c => c.name))
      return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
    }

    // ✅ Use existing api-service function to validate session
    const session = await getSession()
    
    if (!session?.customerId) {
      console.error('[Callback] Invalid or expired session')
      return NextResponse.redirect(new URL('/login?error=invalid_session', request.url))
    }

    console.log(`[Callback] Processing Tink callback for user: ${session.customerId}`)

    // ✅ Use existing api-service function to process the callback
    const result = await processTinkCallback(code)

    if (!result.success) {
      console.error('[Callback] Backend processing failed:', result.message)
      return NextResponse.redirect(
        new URL(`/${session.customerId}/dashboard?error=import_failed&message=${encodeURIComponent(result.message || 'Unknown error')}`, request.url)
      )
    }

    // Success! Redirect to dashboard with import stats
    console.log(`[Callback] Success - Accounts: ${result.accountsCount}, Transactions: ${result.transactionsCount}`)
    
    return NextResponse.redirect(
      new URL(
        `/${session.customerId}/dashboard?import=success&accounts=${result.accountsCount || 0}&transactions=${result.transactionsCount || 0}`,
        request.url
      )
    )
  } catch (error) {
    console.error('[Callback] Unexpected error:', error)
    
    // Try to get customerId from session for redirect
    const session = await getSession().catch(() => null)
    
    const redirectUrl = session?.customerId 
      ? `/${session.customerId}/dashboard?error=callback_failed`
      : '/login?error=callback_failed'
    
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
}
