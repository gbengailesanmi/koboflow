'use server'

import { revalidatePath } from 'next/cache'
import { login as loginService } from '../api/api-service'

/**
 * Server Action to login a user
 * This runs on the server and can be called directly from client components
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
      // Revalidate any pages that depend on session state
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
    console.error('[Auth Action] Login failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to login',
    }
  }
}
