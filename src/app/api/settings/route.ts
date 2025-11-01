import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { connectDB } from '@/db/mongo'

/**
 * POST /api/settings
 * Update user preferences
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { customerId, theme, accentColor, notifications, useFaceId } = body

    // Verify the customerId matches the session
    if (customerId !== session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await connectDB()
    
    // Update user preferences
    await db.collection('users').updateOne(
      { customerId },
      {
        $set: {
          theme,
          accentColor,
          notifications,
          useFaceId,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: 'Preferences updated successfully' 
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
