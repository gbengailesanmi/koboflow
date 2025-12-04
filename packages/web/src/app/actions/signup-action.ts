'use server'

import { signup as signupService } from '../api/api-service'

/**
 * Server Action to signup a new user
 * This runs on the server and can be called directly from client components
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
}> {
  try {
    const result = await signupService(userData)
    
    return {
      success: result.success,
      message: result.message,
      requiresVerification: result.requiresVerification,
    }
  } catch (error: any) {
    console.error('[Auth Action] Signup failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to signup',
    }
  }
}
