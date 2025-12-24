'use server'

import { logger } from '@money-mapper/shared/utils'
import { resendVerificationEmail as resendVerificationEmailService } from '../api/api-service'

/**
 * Server Action to resend verification email
 * This runs on the server and can be called directly from client components
 */
export async function resendVerificationEmailAction(email: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await resendVerificationEmailService(email)
    
    return {
      success: result.success,
      message: result.message,
    }
  } catch (error: any) {
    logger.error({ module: 'resend-verification-email-action', email, error: error.message }, 'Resend verification email failed')
    return {
      success: false,
      message: error.message || 'Failed to resend verification email',
    }
  }
}
