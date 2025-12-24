'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@money-mapper/shared/utils'
import { login as loginService } from '../api/api-service'

/**
 * Server Action to login a user
 * Note: For browser cookie setting, use /api/auth/login route instead
 * This action is for server-side use cases only
 */
export async function loginAction(
  email: string,
  password: string
): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}> {
  try {
    const result = await loginService(email, password)
    
    if (result.success) {
      revalidatePath('/', 'layout')
      return {
        success: true,
        user: result.user,
      }
    }
    
    return {
      success: false,
      message: result.message || 'Login failed',
      requiresVerification: result.requiresVerification,
    }
  } catch (error: any) {
    logger.error({ module: 'login-action', email, error: error.message }, 'Login failed')
    return {
      success: false,
      message: error.message || 'Failed to login',
    }
  }
}
