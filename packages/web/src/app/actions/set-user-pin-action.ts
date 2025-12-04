'use server'

import { revalidateTag } from 'next/cache'
import { setUserPIN } from '../api/api-service'

/**
 * Server Action: Set a new PIN (first-time setup)
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 * @param pin - 4-6 digit PIN
 * @param password - User's account password for encryption
 */
export async function setUserPINAction(
  pin: string,
  password: string
): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await setUserPIN(pin, password)

    if (result.success) {
      revalidateTag('settings')
    }

    return result
  } catch (error: any) {
    console.error('setUserPINAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to set PIN',
    }
  }
}
