'use server'

import { revalidateTag } from 'next/cache'
import { logoutAll as logoutAllService } from '../api/api-service'

/**
 * Server Action to logout from all devices
 * This runs on the server and can be called directly from client components
 */
export async function logoutAllAction(): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await logoutAllService()
    
    if (result.success) {
      // Revalidate session and sessions-list tags
      revalidateTag('session')
      revalidateTag('sessions-list')
      return { success: true }
    }
    
    return {
      success: false,
      message: result.message || 'Logout all failed',
    }
  } catch (error: any) {
    console.error('[Auth Action] Logout all failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to logout from all devices',
    }
  }
}
