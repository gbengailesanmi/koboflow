'use server'

import { revalidateTag } from 'next/cache'
import { logger } from '@money-mapper/shared/utils'
import { verifyEmail as verifyEmailService } from '../../lib/server/api-service'

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
      revalidateTag('session', 'fetch')
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
    logger.error({ module: 'verify-email-action', token, error: error.message }, 'Email verification failed')
    return {
      success: false,
      message: error.message || 'Failed to verify email',
    }
  }
}
