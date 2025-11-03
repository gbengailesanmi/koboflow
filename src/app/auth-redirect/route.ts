import { NextResponse } from 'next/server'
import { auth, signOut } from '@/auth'
import { connectDB } from '@/db/mongo'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.customerId) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  }

  // Verify the user actually exists in the database
  try {
    const db = await connectDB()
    const user = await db.collection('users').findOne({ 
      customerId: session.user.customerId 
    })
    
    // If user doesn't exist in database, sign them out and redirect to login
    if (!user) {
      // Sign out is allowed in Route Handlers
      await signOut({ redirect: false })
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
    }
  } catch (error) {
    console.error('Error verifying user:', error)
    // If there's a DB error, sign out to be safe
    await signOut({ redirect: false })
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  }

  return NextResponse.redirect(
    new URL(`/${session.user.customerId}/dashboard`, process.env.NEXTAUTH_URL || 'http://localhost:3000')
  )
}
