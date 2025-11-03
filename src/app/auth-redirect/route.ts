import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.customerId) {
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
    }

    return NextResponse.redirect(
      new URL(`/${session.user.customerId}/dashboard`, process.env.NEXTAUTH_URL || 'http://localhost:3000')
    )
  } catch (error) {
    console.error('Auth redirect error:', error)
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  }
}
