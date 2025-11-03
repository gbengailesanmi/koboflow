import { NextResponse } from 'next/server'
import { auth, signOut } from '@/auth'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.customerId) {
    return NextResponse.json({ user: null })
  }
  
  return NextResponse.json({ 
    user: session.user.customerId,
    email: session.user.email,
    name: session.user.name
  })
}

export async function DELETE() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json({ success: false, message: 'Logout failed' }, { status: 500 })
  }
}
