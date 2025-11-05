import { NextResponse } from 'next/server'
import { auth, signOut } from '@/auth'

const BASE_URL = process.env.NEXTAUTH_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.customerId) {
    return NextResponse.redirect(new URL('/login', BASE_URL))
  }

  // Verify the user actually exists in the database by calling backend API
  try {
    const response = await fetch(`${API_URL}/api/auth/user/${session.user.customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    // If user doesn't exist in database, sign them out and redirect to login
    if (!response.ok) {
      // Sign out is allowed in Route Handlers
      await signOut({ redirect: false })
      return NextResponse.redirect(new URL('/login', BASE_URL))
    }

    const data = await response.json()
    if (!data.success || !data.user) {
      await signOut({ redirect: false })
      return NextResponse.redirect(new URL('/login', BASE_URL))
    }
  } catch (error) {
    console.error('Error verifying user:', error)
    // If there's an API error, sign out to be safe
    await signOut({ redirect: false })
    return NextResponse.redirect(new URL('/login', BASE_URL))
  }

  return NextResponse.redirect(
    new URL(`/${session.user.customerId}/dashboard`, BASE_URL)
  )
}
