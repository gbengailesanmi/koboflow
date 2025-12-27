'use server'

import { revalidateTag } from 'next/cache'
import { logout as logoutService } from '../../lib/server/api-service'

/**
 * Server Action to logout current user session
 * This runs on the server and can be called directly from client components
 */
export async function logoutAction(): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await logoutService()
    
    if (result.success) {
      revalidateTag('session', 'fetch')
      revalidateTag('sessions-list', 'fetch')
      return { success: true }
    }
    
    return {
      success: false,
      message: result.message || 'Logout failed',
    }
  } catch (error: any) {
    console.error('[Auth Action] Logout failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to logout',
    }
  }
}
