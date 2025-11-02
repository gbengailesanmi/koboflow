import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUserSettings, updateUserSettings, SettingsUpdate } from '@/lib/settings-helpers'

/**
 * GET /api/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const settings = await getUserSettings(session.customerId)

    return NextResponse.json({ 
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings
 * Update user settings
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
    const { customerId, ...updates } = body

    // Verify the customerId matches the session
    if (customerId && customerId !== session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update settings in the settings collection
    const updatedSettings = await updateUserSettings(
      session.customerId,
      updates as SettingsUpdate
    )

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
