// packages/web/src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import config from '@/config'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth', req.url))
  }

  // 1️⃣ Call backend to exchange code
  const backendRes = await fetch(
    `${config.NEXT_PUBLIC_BACKEND_URL}/api/auth/google/callback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }
  )

  if (!backendRes.ok) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url))
  }

  // 2️⃣ Create frontend response
  const response = NextResponse.redirect(new URL('/dashboard', req.url))

  // 3️⃣ Forward ALL Set-Cookie headers
  const setCookies = backendRes.headers.getSetCookie()
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie)
  }

  return response
}
