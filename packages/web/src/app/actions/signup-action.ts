'use server'

import { signup as signupService } from '../api/api-service'

/**
 * Server Action to signup a new user
 * Note: For browser cookie setting, use /api/auth/signup route instead
 * This action is for server-side use cases only
 */
export async function signupAction(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}> {
  try {
    const result = await signupService(userData)
    
    return {
      success: result.success,
      message: result.message,
      requiresVerification: result.requiresVerification,
      user: result.user,
    }
  } catch (error: any) {
    console.error('[Auth Action] Signup failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to signup',
    }
  }
}
