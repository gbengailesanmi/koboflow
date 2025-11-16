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

import config from '../config'

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

export async function logoutClient() {
  return fetchClient('/api/auth/logout', { method: 'POST' })
}

export async function logoutAllClient() {
  return fetchClient('/api/auth/logout-all', { method: 'POST' })
}

// ============================================================================
// MUTATIONS (Client-side only - invalidate cache via router.refresh())
// ============================================================================

export async function updateBudgetClient(customerId: string, data: any) {
  return fetchClient(`/api/budget/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSettingsClient(customerId: string, data: any) {
  return fetchClient(`/api/settings/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
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
