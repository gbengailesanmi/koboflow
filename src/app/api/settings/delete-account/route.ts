import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { connectDB } from '@/db/mongo'

/**
 * DELETE /api/settings/delete-account
 * Delete user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { customerId } = body

    // Verify the customerId matches the session
    if (customerId !== session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await connectDB()
    
    // Delete all user data
    await Promise.all([
      db.collection('users').deleteOne({ customerId }),
      db.collection('accounts').deleteMany({ customerId }),
      db.collection('transactions').deleteMany({ customerId }),
      db.collection('budgets').deleteOne({ customerId }),
      db.collection('spending_categories').deleteMany({ customerId })
    ])

    // Clear session
    const response = NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })

    response.cookies.set('session', '', {
      expires: new Date(0),
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
