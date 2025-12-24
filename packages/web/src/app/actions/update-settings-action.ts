'use server'

import { revalidateTag } from 'next/cache'
import { updateSettings } from '../api/api-service'
import { UserSettings } from '@money-mapper/shared'

/**
 * Server Action: Update user settings
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function updateSettingsAction(settings: Partial<UserSettings>): Promise<{
  success: boolean
  message?: string
  settings?: UserSettings
}> {
  try {
    const result = await updateSettings(settings)

    if (result.success) {
      revalidateTag('settings', 'fetch')
      revalidateTag('session', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('updateSettingsAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update settings',
    }
  }
}
