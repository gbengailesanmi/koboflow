'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { revokeSession, revokeAllSessions, getActiveSessions } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

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
 * Logout all sessions (all devices)
 */
export async function logoutAllDevicesAction() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await revokeAllSessions()
    
    if (result.success) {
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

/**
 * Get all active sessions for current user
 */
export async function getActiveSessionsAction() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await getActiveSessions()
    
    return result
  } catch (error) {
    logger.error({ module: 'session-actions', error }, 'Get sessions error')
    return { success: false, error: 'Failed to fetch sessions' }
  }
}
