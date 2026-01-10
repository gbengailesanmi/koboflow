'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { revokeSession, revokeAllSessions } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'
import { revalidateTag } from 'next/cache'

/**
 * Logout current session
 * Should be called before NextAuth signOut() on the client
 */
export async function logoutAction() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const sessionId = session.user.sessionId
    
    if (!sessionId) {
      logger.warn({ module: 'session-actions' }, 'No sessionId in session - skipping revocation')
      // Still return success so logout can proceed client-side
      return { success: true }
    }

    const result = await revokeSession(sessionId)
    
    if (result.success) {
      logger.info({ 
        module: 'session-actions', 
        customerId: session.user.customerId,
        sessionId 
      }, 'User logged out')
    }

    return result
  } catch (error) {
    logger.error({ module: 'session-actions', error }, 'Logout error')
    return { success: false, error: 'Logout failed' }
  }
}

/**
 * Revoke a specific session by sessionId
 * Revalidates sessions cache
 */
export async function revokeSessionAction(sessionId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await revokeSession(sessionId)
    
    if (result.success) {
      revalidateTag('sessions', 'default')
      logger.info({ 
        module: 'session-actions', 
        customerId: session.user.customerId,
        revokedSessionId: sessionId 
      }, 'Session revoked')
    }

    return result
  } catch (error) {
    logger.error({ module: 'session-actions', error, sessionId }, 'Revoke session error')
    return { success: false, error: 'Failed to revoke session' }
  }
}

/**
 * Logout all sessions (all devices)
 * Revalidates sessions cache
 */
export async function logoutAllDevicesAction() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await revokeAllSessions()
    
    if (result.success) {
      revalidateTag('sessions', 'default')
      logger.info({ 
        module: 'session-actions', 
        customerId: session.user.customerId,
        count: result.count 
      }, 'All sessions revoked')
    }

    return result
  } catch (error) {
    logger.error({ module: 'session-actions', error }, 'Logout all devices error')
    return { success: false, error: 'Failed to logout all devices' }
  }
}
