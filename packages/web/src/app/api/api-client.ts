/**
 * CLIENT-SIDE API WRAPPER
 * 
 * Use this ONLY in Client Components ('use client')
 * For Server Components, use api-service.ts directly
 * 
 * Client-side fetches are NOT cached by Next.js,
 * so use sparingly and prefer Server Components when possible.
 */

'use client'

import config from '../../config'

const BACKEND_URL = config.BACKEND_URL

// ============================================================================
// CLIENT-SIDE FETCH WRAPPER
// ============================================================================

/**
 * Makes client-side API requests with automatic cookie handling
 * Redirects to login on 401 Unauthorized
 */
async function fetchClient(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Send session-id cookie
      cache: 'no-store', // Never cache client-side requests
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired or invalid
        console.warn('[API Client] Unauthorized - redirecting to login')
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('[API Client] Request failed:', endpoint, error)
    throw error
  }
}

// ============================================================================
// AUTHENTICATION (Client-side)
// ============================================================================

/**
 * Login user (client-side)
 * MUST be client-side so browser receives session-id cookie
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

export async function logoutClient() {
  return logoutUser()
}

export async function logoutAllClient() {
  return logoutAllSessions()
}

// ============================================================================
// MUTATIONS (Client-side only - invalidate cache via router.refresh())
// ============================================================================

export async function updateBudgetClient(customerId: string, data: any) {
  return updateBudget(data)
}

export async function updateSettingsClient(customerId: string, data: any) {
  return updateAppSettings(data)
}

export async function createTransactionClient(customerId: string, data: any) {
  return fetchClient(`/api/transactions/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTransactionClient(transactionId: string, data: any) {
  return fetchClient(`/api/transactions/${transactionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTransactionClient(transactionId: string) {
  return fetchClient(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// MUTATIONS (Client-side only - invalidate cache via router.refresh())
// ============================================================================

export async function updateBudget(data: any) {
  return fetchClient('/api/budget', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAppSettings(data: any) {
  return fetchClient('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function updateUserProfile(data: any) {
  return fetchClient('/api/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteUserAccount() {
  return fetchClient('/api/user/account', {
    method: 'DELETE',
  })
}

export async function logoutUser() {
  return fetchClient('/api/auth/logout', {
    method: 'POST',
  })
}

export async function logoutAllSessions() {
  return fetchClient('/api/auth/logout-all', {
    method: 'POST',
  })
}

// ============================================================================
// REAL-TIME DATA (When you need fresh data in a client component)
// ============================================================================

/**
 * Get fresh session data (not cached)
 * Use only when you need real-time session validation
 */
export async function getSessionClient() {
  return fetchClient('/api/session')
}

/**
 * Get fresh accounts (not cached)
 * Prefer server-side getAccounts() from api-service.ts
 */
export async function getAccountsClient(customerId: string) {
  return fetchClient(`/api/accounts/${customerId}`)
}

/**
 * Get fresh transactions (not cached)
 * Prefer server-side getTransactions() from api-service.ts
 */
export async function getTransactionsClient(customerId: string) {
  return fetchClient(`/api/transactions/${customerId}`)
}
