import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const db = await connectDB()

    // Check if email is already taken by another user
    const existingUser = await db.collection('users').findOne({ 
      email: email.toLowerCase(), 
      customerId: { $ne: user.customerId } 
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already taken' }, { status: 409 })
    }

    // Update the user
    const result = await db.collection('users').updateOne(
      { customerId: user.customerId },
      { 
        $set: { 
          name: name.trim(),
          email: email.toLowerCase().trim()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        name: name.trim(),
        email: email.toLowerCase().trim()
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
