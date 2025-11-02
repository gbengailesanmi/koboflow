import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/db/mongo'

export async function GET() {
  try {
    // Get the current session
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ email: session.user.email })

    if (user?.customerId) {
      return NextResponse.redirect(new URL(`/${user.customerId}/dashboard`, process.env.NEXTAUTH_URL))
    }

    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
  } catch (error) {
    console.error('Auth redirect error:', error)
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
  }
}
