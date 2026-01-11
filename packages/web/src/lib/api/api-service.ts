///Users/gbenga.ilesanmi/Github/PD/koboflow/packages/web/src/lib/server/api-service.ts
'server-only'

import { cookies } from 'next/headers'
import config from '../../config'
import { logger } from '@koboflow/shared'
import { addApiSignature } from '../auth/signature-signer'
import type {
  Account,
  EnrichedTransaction,
  Budget,
  CustomCategory,
  CategoryBudget,
  BudgetPeriod,
  UserSettings,
} from '@koboflow/shared'

export interface SessionUser {
  customerId: string
  email: string
  firstName: string
  lastName: string
  name: string
}

export type Settings = UserSettings

const BACKEND_URL = config.NEXT_PUBLIC_BACKEND_URL


export async function serverFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies()

  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ')

  const urlObj = new URL(url)
  const path = urlObj.pathname

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    Cookie: cookieHeader,
  }

  const signedHeaders = addApiSignature({
    headers,
    method: options.method || 'GET',
    path: path,
    body: options.body,
  })

  const response = await fetch(url, {
    ...options,
    headers: signedHeaders,
    cache: options.cache ?? 'no-store',
  })

  return response
}

/**
 * Parse JSON response with error handling
 */
async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    
    const error: any = new Error(errorData.message || `Request failed: ${response.status}`)
    error.statusCode = response.status
    error.statusText = response.statusText
    error.response = errorData
    
    throw error
  }
  return response.json()
}

/**
 * Get all accounts for current user
 * Cache tag: 'accounts'
 * Revalidates: After Mono callback imports new accounts
 */
export async function getAccounts(): Promise<Account[]> {
  try {
    console.log('[getAccounts] Starting fetch from backend:', `${BACKEND_URL}/api/accounts`)
    
    const response = await serverFetch(`${BACKEND_URL}/api/accounts`, {
      next: { tags: ['accounts'] },
    })

    console.log('[getAccounts] Response status:', response.status, response.statusText)

    const data = await parseResponse<{ status: string; message: string; timestamp: string; data: any[] }>(response)
    console.log('[getAccounts] Parsed data:', {
      status: data.status,
      dataIsArray: Array.isArray(data.data),
      dataLength: data.data?.length,
      firstItem: data.data?.[0]
    })

    const accounts = Array.isArray(data.data)
      ? data.data.map((item: any) => item.account)
      : []
    
    console.log('[getAccounts] Mapped accounts:', accounts.length, 'accounts')
    return accounts
  } catch (error: any) {
    console.error('[getAccounts] ERROR:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response
    })
    logger.error({ module: 'api-service', err: error }, 'getAccounts error')
    return []
  }
}

/**
 * Get all transactions for current user
 * Cache tag: 'transactions'
 * Revalidates: After create, update, delete transaction, or Mono callback
 */
export async function getTransactions(): Promise<EnrichedTransaction[]> {
  try {
    console.log('[getTransactions] Starting fetch from backend:', `${BACKEND_URL}/api/transactions`)
    
    const response = await serverFetch(`${BACKEND_URL}/api/transactions`, {
      next: { tags: ['transactions'] },
    })

    console.log('[getTransactions] Response status:', response.status, response.statusText)

    const data = await parseResponse<{ status: string; message: string; timestamp: string; data: EnrichedTransaction[] }>(response)
    console.log('[getTransactions] Parsed data:', {
      status: data.status,
      dataIsArray: Array.isArray(data.data),
      dataLength: data.data?.length
    })

    const transactions = data.data || []
    
    console.log('[getTransactions] Final transactions:', transactions.length, 'transactions')
    return transactions
  } catch (error: any) {
    console.error('[getTransactions] ERROR:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response
    })
    logger.error({ module: 'api-service', err: error }, 'getTransactions error')
    return []
  }
}


/**
 * Get all budgets for current user
 * Cache tag: 'budgets'
 * Revalidates: After budget create, update, delete, activate
 */
export async function getBudgets(): Promise<Budget[]> {
  try {
    console.log('[getBudgets] Starting fetch from backend:', `${BACKEND_URL}/api/budget/all`)
    
    const response = await serverFetch(`${BACKEND_URL}/api/budget/all`, {
      next: { tags: ['budgets'] },
    })

    console.log('[getBudgets] Response status:', response.status, response.statusText)

    const data = await parseResponse<{ success: boolean; budgets: Budget[] }>(response)
    console.log('[getBudgets] Parsed data:', {
      success: data.success,
      budgetsIsArray: Array.isArray(data.budgets),
      budgetsLength: data.budgets?.length
    })

    const budgets = data.budgets || []
    console.log('[getBudgets] Final budgets:', budgets.length, 'budgets')
    return budgets
  } catch (error: any) {
    console.error('[getBudgets] ERROR:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response
    })
    logger.error({ module: 'api-service', err: error }, 'getBudgets error')
    return []
  }
}

/**
 * Get active budget for current user
 * Cache tag: 'budget'
 * Revalidates: After budget POST or PATCH, or activate
 */
export async function getBudget(): Promise<Budget | null> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/budget`, {
      next: { tags: ['budget'] },
    })

    const data = await parseResponse<Budget>(response)
    return data
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'getBudget error')
    return null
  }
}

/**
 * Get specific budget by ID
 * Cache tag: 'budgets'
 */
export async function getBudgetById(budgetId: string): Promise<Budget | null> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/budget/${budgetId}`, {
      next: { tags: ['budgets'] },
    })

    const data = await parseResponse<Budget>(response)
    return data
  } catch (error: any) {
    logger.error({ module: 'api-service', budgetId, err: error }, 'getBudgetById error')
    return null
  }
}


/**
 * Get settings for current user
 * Cache tag: 'settings'
 * Revalidates: After settings POST
 */
export async function getSettings(): Promise<Settings | null> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings`, {
      next: { tags: ['settings'] },
    })

    const data = await parseResponse<{ success: boolean; settings: Settings }>(response)
    return data.settings || null
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'getSettings error')
    return null
  }
}


/**
 * Get all categories for current user (default + custom)
 * Cache tag: 'categories'
 * Revalidates: After category POST, PATCH, DELETE
 */
export async function getCategories(): Promise<CustomCategory[]> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/categories`, {
      next: { tags: ['categories'] },
    })

    const data = await parseResponse<CustomCategory[]>(response)
    return data || []
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'getCategories error')
    return []
  }
}

/**
 * Get only custom categories (filters out default ones)
 * Cache tag: 'categories'
 * Revalidates: After category POST, PATCH, DELETE
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
  try {
    const categories = await getCategories()
    return categories.filter(cat => !cat.isDefault)
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'getCustomCategories error')
    return []
  }
}

/**
 * Verify email with token
 * Pure API call - revalidation handled by action layer
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean
  message?: string
  customerId?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ token }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Resend verification email
 * Pure API call - no revalidation needed
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Create new user account (signup)
 * Pure API call - no revalidation needed (creates new user)
 */
export async function signupUser(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<{
  success: boolean
  requiresVerification?: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Create a new budget
 * Pure API call - revalidation handled by action layer
 */
export async function createNewBudget(
  name: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod,
  setAsActive?: boolean
): Promise<{ success: boolean; message?: string; budgetId?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget/create`, {
    method: 'POST',
    body: JSON.stringify({ name, totalBudgetLimit, categories, period, setAsActive }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Update specific budget by ID
 * Pure API call - revalidation handled by action layer
 */
export async function updateBudgetById(
  budgetId: string,
  updates: {
    name?: string
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget/${budgetId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Set a budget as active
 * Pure API call - revalidation handled by action layer
 */
export async function setActiveBudget(budgetId: string): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget/${budgetId}/activate`, {
    method: 'POST',
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Delete a budget
 * Pure API call - use deleteBudgetAction for cache revalidation
 */
export async function deleteBudgetById(budgetId: string): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget/${budgetId}`, {
    method: 'DELETE',
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Create or fully replace budget (backwards compatibility)
 * Pure API call - use updateBudgetAction for cache revalidation
 */
export async function updateBudget(
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod
): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget`, {
    method: 'POST',
    body: JSON.stringify({ totalBudgetLimit, categories, period }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Partially update budget (PATCH)
 * Pure API call - use patchBudgetAction for cache revalidation
 */
export async function patchBudget(updates: {
  totalBudgetLimit?: number
  categories?: CategoryBudget[]
  period?: BudgetPeriod
}): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/budget`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    cache: 'no-store',
  })

  return await response.json()
}


/**
 * Update user settings
 * Pure API call - use updateSettingsAction for cache revalidation
 */
export async function updateSettings(settings: Partial<UserSettings>): Promise<{
  success: boolean
  message?: string
  settings?: UserSettings
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Delete user account and all associated data
 * Pure API call - use deleteAccountAction for cache revalidation
 */
export async function deleteAccount(): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings/account`, {
    method: 'DELETE',
    cache: 'no-store',
  })

  return await response.json()
}


/**
 * Set a new PIN (first-time setup)
 * Pure API call - use setUserPINAction for cache revalidation
 * @param pin - 4-6 digit PIN
 * @param password - User's account password for encryption
 */
export async function setUserPIN(pin: string, password: string): Promise<{
  success: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/set`, {
    method: 'POST',
    body: JSON.stringify({ pin, password }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Change existing PIN
 * Pure API call - use changeUserPINAction for cache revalidation
 * @param oldPin - Current PIN
 * @param newPin - New 4-6 digit PIN
 * @param password - User's account password
 */
export async function changeUserPIN(
  oldPin: string,
  newPin: string,
  password: string
): Promise<{
  success: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/change`, {
    method: 'POST',
    body: JSON.stringify({ oldPin, newPin, password }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Verify if a PIN is correct
 * Pure API call - no cache revalidation needed (read-only)
 * @param pin - PIN to verify
 * @param password - User's account password
 */
export async function verifyUserPIN(pin: string, password: string): Promise<{
  success: boolean
  valid?: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/verify`, {
    method: 'POST',
    body: JSON.stringify({ pin, password }),
    cache: 'no-store',
  })

  return await response.json()
}


/**
 * Change user password (automatically re-encrypts PIN if set)
 * Pure API call - use changeUserPasswordAction for cache revalidation
 * @param currentPassword - Current password
 * @param newPassword - New password (min 8 characters)
 * @param confirmPassword - Confirmation of new password
 */
export async function changeUserPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{
  success: boolean
  message?: string
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/settings/password/change`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    cache: 'no-store',
  })

  return await response.json()
}


/**
 * Create custom category
 * Pure API call - use createCustomCategoryAction for cache revalidation
 */
export async function createCustomCategory(categoryData: {
  name: string
  keywords: string[]
  color?: string
}): Promise<CustomCategory | null> {
  const response = await serverFetch(`${BACKEND_URL}/api/categories`, {
    method: 'POST',
    body: JSON.stringify(categoryData),
    cache: 'no-store',
  })

  return await parseResponse<CustomCategory>(response)
}

/**
 * Update custom category
 * Pure API call - use updateCustomCategoryAction for cache revalidation
 */
export async function updateCustomCategory(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
): Promise<{ success: boolean }> {
  const response = await serverFetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    cache: 'no-store',
  })

  return await parseResponse<{ success: boolean }>(response)
}

/**
 * Delete custom category
 * Pure API call - use deleteCustomCategoryAction for cache revalidation
 */
export async function deleteCustomCategory(categoryId: string): Promise<{ success: boolean }> {
  const response = await serverFetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
    method: 'DELETE',
    cache: 'no-store',
  })

  return await parseResponse<{ success: boolean }>(response)
}


/**
 * Update user profile
 * Pure API call - use updateUserProfileAction for cache revalidation
 */
export async function updateUserProfile(
  customerId: string,
  updates: {
    firstName?: string
    lastName?: string
    email?: string
    totalBudgetLimit?: number
  }
): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/user/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Get user by customerId (public endpoint - used for OAuth flows)
 */
export async function getUserByCustomerId(customerId: string): Promise<{
  success: boolean
  user?: any
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/user/${customerId}`, {
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', customerId, err: error }, 'getUserByCustomerId error')
    return {
      success: false,
      message: error.message || 'Failed to fetch user',
    }
  }
}

export async function exchangeMonoToken(code: string): Promise<{
  success: boolean
  message?: string
  accountId?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'exchangeMonoToken error')
    return { success: false, message: error.message }
  }
}

export async function importMonoAccount(accountId: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  account?: any
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/import/${accountId}`,
      { method: 'POST', cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', accountId, err: error }, 'importMonoAccount error')
    return { success: false, message: error.message }
  }
}

export async function syncMonoTransactions(
  accountId: string,
  options?: { start?: string; end?: string }
): Promise<{
  success: boolean
  message?: string
  transactionsCount?: number
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/sync-transactions/${accountId}`,
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {}),
        cache: 'no-store' 
      }
    )
    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', accountId, err: error }, 'syncMonoTransactions error')
    return { success: false, message: error.message }
  }
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<{
  customerId: string
  firstName: string
  lastName: string
} | null> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/auth/validate-credentials`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return null
    }

    const user = await response.json()
    return user
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'validateCredentials error')
    return null
  }
}

/**
 * Handle Google OAuth sign-in
 * Used by NextAuth GoogleProvider signIn callback
 * Pure API call - no cache revalidation needed
 */
export async function googleSignIn(
  email: string,
  name: string
): Promise<{
  customerId: string
  firstName: string
  lastName: string
} | null> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/auth/oauth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sign-in failed' }))
      logger.error({ 
        module: 'api-service',
        error: {
          message: error?.message,
          statusCode: response?.status,
          statusText: response?.statusText
        }
      }, 'googleSignIn failed')
      return null
    }

    const userData = await response.json()
    return userData
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'googleSignIn error')
    return null
  }
}

/**
 * Get customer details (with masked BVN)
 * Used by user details API route
 * Cache tag: 'user-details'
 */
export async function getCustomerDetails(customerId: string): Promise<any> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/auth/customer-details/${customerId}`,
      {
        next: { tags: ['user-details'] },
      }
    )

    const data = await parseResponse(response)
    return data
  } catch (error: any) {
    logger.error({ module: 'api-service', customerId, err: error }, 'getCustomerDetails error')
    throw error
  }
}

/**
 * Session Management API calls
 * Used by NextAuth callbacks and logout flows
 */

/**
 * Create a new session
 * Called from NextAuth jwt callback on initial sign-in
 */
export async function createSession(
  sessionId: string,
  customerId: string,
  expiresAt?: Date
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, customerId, expiresAt }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'createSession error')
    return { success: false, message: error.message }
  }
}

/**
 * Validate a session
 * Called from backend middleware before processing authenticated requests
 */
export async function validateSession(
  sessionId: string,
  customerId: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/session/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, customerId }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'validateSession error')
    return { valid: false, message: error.message }
  }
}

/**
 * Revoke a specific session (logout)
 * Called from logout action
 */
export async function revokeSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/session/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'revokeSession error')
    return { success: false, message: error.message }
  }
}

/**
 * Revoke all sessions for current user (logout all devices)
 */
export async function revokeAllSessions(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/session/revoke-all`, {
      method: 'POST',
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'revokeAllSessions error')
    return { success: false, message: error.message }
  }
}

/**
 * Get all active sessions for current user
 */
export async function getActiveSessions(): Promise<{
  success: boolean
  sessions?: Array<{
    sessionId: string
    createdAt: Date
    expiresAt: Date
    lastActivity?: Date
    userAgent?: string
  }>
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/sessions`, {
      next: { tags: ['sessions'] },
    })

    return await response.json()
  } catch (error: any) {
    logger.error({ module: 'api-service', err: error }, 'getActiveSessions error')
    return { success: false, message: error.message }
  }
}
