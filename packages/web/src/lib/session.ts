/**
 * Session management for both client and server
 * Handles JWT token storage and retrieval
 */

import { cookies } from 'next/headers'

export interface SessionData {
  customerId: string
  email: string
  name?: string
}

/**
 * Get session data from cookies (SERVER-SIDE)
 * This is used in Server Components and API routes
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    // Call backend to validate session
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${API_URL}/api/session`, {
      headers: {
        Cookie: `auth-token=${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get session data from cookies (CLIENT-SIDE)
 * This reads the JWT token set by the backend
 */
export function getSessionFromCookies(): SessionData | null {
  if (typeof window === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(c => c.trim().startsWith('session='))
  
  if (!sessionCookie) {
    return null
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]))
    return sessionData
  } catch {
    return null
  }
}

/**
 * Clear session (logout)
 */
export function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  // Clear the auth-token cookie (will be done by backend on logout)
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}
