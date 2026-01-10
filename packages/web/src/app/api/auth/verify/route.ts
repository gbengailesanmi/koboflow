// /Users/gbenga.ilesanmi/Github/PD/koboflow/packages/web/src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/api/api-service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  try {
    const data = await verifyEmail(token)

    if (data.success) {
      return NextResponse.redirect(new URL('/verify-email?verified=true', request.url))
    } else {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/verify-email?error=failed', request.url))
  }
}
