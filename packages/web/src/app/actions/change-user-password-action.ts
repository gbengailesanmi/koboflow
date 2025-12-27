'use server'

import { revalidateTag } from 'next/cache'
import { changeUserPassword } from '../../lib/server/api-service'

/**
 * Server Action: Change user password (automatically re-encrypts PIN if set)
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 * @param currentPassword - Current password
 * @param newPassword - New password (min 8 characters)
 * @param confirmPassword - Confirmation of new password
 */
export async function changeUserPasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await changeUserPassword(currentPassword, newPassword, confirmPassword)

    if (result.success) {
      revalidateTag('settings', 'fetch')
      revalidateTag('session', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('changeUserPasswordAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to change password',
    }
  }
}
