import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: user.customerId })
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    
    cookieStore.delete('jwt_token')
    
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json({ success: false, message: 'Logout failed' }, { status: 500 })
  }
}
