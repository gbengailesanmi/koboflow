'use server'

import { revalidateTag } from 'next/cache'
import { changeUserPIN } from '../../lib/server/api-service'

/**
 * Server Action: Change existing PIN
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 * @param oldPin - Current PIN
 * @param newPin - New 4-6 digit PIN
 * @param password - User's account password
 */
export async function changeUserPINAction(
  oldPin: string,
  newPin: string,
  password: string
): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await changeUserPIN(oldPin, newPin, password)

    if (result.success) {
      revalidateTag('settings', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('changeUserPINAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to change PIN',
    }
  }
}
