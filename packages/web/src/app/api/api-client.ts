'use client'

import config from '../../config'

const BACKEND_URL = config.BACKEND_URL

// ============================================================================
// CLIENT-SIDE FETCH WRAPPER
// ============================================================================

async function fetchClient(endpoint: string, options: RequestInit = {}) {
  const fullUrl = `${BACKEND_URL}${endpoint}`
  console.log('[API Client] Request:', options.method || 'GET', fullUrl)
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Send session-id cookie
      cache: 'no-store', // Never cache client-side requests
    })

    console.log('[API Client] Response:', response.status, response.statusText)

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired or invalid
        console.warn('[API Client] Unauthorized - redirecting to login')
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }
      
      const errorData = await response.json().catch(() => ({}))
      console.error('[API Client] Error response:', errorData)
      throw new Error(errorData.message || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('[API Client] Request failed:', endpoint, error)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('[API Client] Network error - is the backend running?', BACKEND_URL)
      console.error('[API Client] Check CORS configuration and ensure backend is accessible')
    }
    throw error
  }
}

// ============================================================================
// AUTHENTICATION (Client-side only)
// ============================================================================

/**
 * Login user (client-side)
 * MUST be client-side so browser receives session-id cookie directly
 */
export async function loginClient(email: string, password: string) {
  return fetchClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Signup user (client-side)
 * MUST be client-side so browser can receive verification instructions
 */
export async function signupClient(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}) {
  return fetchClient('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

/**
 * Logout current session (client-side convenience wrapper)
 * Alternative: Use logoutAction from /app/actions/logout-action.ts
 */
export async function logoutClient() {
  return fetchClient('/api/auth/logout', {
    method: 'POST',
  })
}

/**
 * Logout from all devices (client-side convenience wrapper)
 * Alternative: Use logoutAllAction from /app/actions/logout-all-action.ts
 */
export async function logoutAllClient() {
  return fetchClient('/api/auth/logout-all', {
    method: 'POST',
  })
}

// ============================================================================
// PIN VERIFICATION (Client-side only)
// ============================================================================

/**
 * Verify if a PIN is correct
 * Client-side only because user types PIN in client components
 * @param pin - PIN to verify
 * @param password - User's account password
 * @returns Object with valid: boolean
 */
export async function verifyUserPIN(pin: string, password: string) {
  return fetchClient('/api/settings/pin/verify', {
    method: 'POST',
    body: JSON.stringify({ pin, password }),
  })
}

// ============================================================================
// REAL-TIME SESSION CHECK (Client-side only)
// ============================================================================

/**
 * Get fresh session data (not cached)
 * Use only when you need real-time session validation in client components
 * For server-side, use getSession() from api-service.ts
 */
export async function getSessionClient() {
  return fetchClient('/api/session')
}
