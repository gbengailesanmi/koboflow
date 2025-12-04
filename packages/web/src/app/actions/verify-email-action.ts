'use server'

import { revalidateTag } from 'next/cache'
import { verifyEmail as verifyEmailService } from '../api/api-service'

/**
 * Server Action to verify user email with token
 * This runs on the server and can be called directly from client components
 */
export async function verifyEmailAction(token: string): Promise<{
  success: boolean
  message?: string
  customerId?: string
}> {
  try {
    const result = await verifyEmailService(token)
    
    if (result.success) {
      // Revalidate session tag after successful verification
      revalidateTag('session')
      return {
        success: true,
        customerId: result.customerId,
      }
    }
    
    return {
      success: false,
      message: result.message || 'Email verification failed',
    }
  } catch (error: any) {
    console.error('[Auth Action] Email verification failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to verify email',
    }
  }
}
