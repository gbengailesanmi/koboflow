'server only'

import { cookies } from 'next/headers'
import config from '../../config'
import type {
  Account,
  Transaction,
  Budget,
  CustomCategory,
  CategoryBudget,
  BudgetPeriod,
  UserSettings,
} from '@money-mapper/shared'

export interface SessionUser {
  customerId: string
  email: string
  firstName: string
  lastName: string
  name: string
}

export type Settings = UserSettings

const BACKEND_URL = config.NEXT_PUBLIC_BACKEND_URL


/**
 * Server-side fetch helper with session cookie forwarding
 * Automatically includes session-id cookie from Next.js server context
 */
async function serverFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = cookies() // ❗️ NO await
  const sessionId = cookieStore.get('session-id')?.value

  const headers = new Headers(options.headers)

  if (sessionId) {
    headers.set('Cookie', `session-id=${sessionId}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    // credentials is irrelevant server-side, but harmless
    cache: options.cache ?? 'force-cache',
  })
}

/**
 * Parse JSON response with error handling
 */
async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(errorData.message || `Request failed: ${response.status}`)
  }
  return response.json()
}


/**
 * Get current session user
 * Cache tag: 'session'
 * Revalidates: After login, logout, profile updates
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/session`, {
      next: { tags: ['session'] },
    })

    if (!response.ok) {
      return null
    }

    const data = await parseResponse<{ success: boolean; user: SessionUser }>(response)

    return data.success ? data.user : null
  } catch (error) {
    console.error('getSession error:', error)
    return null
  }
}

/**
 * Get all active sessions for current user
 * Cache tag: 'sessions-list'
 * Revalidates: After logout, logout-all
 */
export async function getActiveSessions(): Promise<any[]> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/sessions`, {
      next: { tags: ['sessions-list'] },
    })

    const data = await parseResponse<{ success: boolean; sessions: any[] }>(response)
    return data.sessions || []
  } catch (error) {
    console.error('getActiveSessions error:', error)
    return []
  }
}


/**
 * Get all accounts for current user
 * Cache tag: 'accounts'
 * Revalidates: After Mono callback imports new accounts
 */
export async function getAccounts(): Promise<Account[]> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/accounts`, {
      next: { tags: ['accounts'] },
    })

    const data = await parseResponse<{ status: string; message: string; timestamp: string; data: any[] }>(response)
    const accounts = Array.isArray(data.data)
      ? data.data.map((item: any) => item.account)
      : []
    return accounts
  } catch (error) {
    console.error('getAccounts error:', error)
    return []
  }
}


/**
 * Get all transactions for current user
 * Cache tag: 'transactions'
 * Revalidates: After create, update, delete transaction, or Mono callback
 */
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/transactions`, {
      next: { tags: ['transactions'] },
    })

    const data = await parseResponse<{ status: string; message: string; timestamp: string; data: Transaction[] }>(response)
    return data.data || []
  } catch (error) {
    console.error('getTransactions error:', error)
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
    const response = await serverFetch(`${BACKEND_URL}/api/budget/all`, {
      next: { tags: ['budgets'] },
    })

    const data = await parseResponse<{ success: boolean; budgets: Budget[] }>(response)
    return data.budgets || []
  } catch (error) {
    console.error('getBudgets error:', error)
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
  } catch (error) {
    console.error('getBudget error:', error)
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
  } catch (error) {
    console.error('getBudgetById error:', error)
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
  } catch (error) {
    console.error('getSettings error:', error)
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
  } catch (error) {
    console.error('getCategories error:', error)
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
  } catch (error) {
    console.error('getCustomCategories error:', error)
    return []
  }
}


/**
 * Login user
 * Pure API call - used by server actions for server-side auth checks
 */
export async function login(email: string, password: string): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Signup new user
 * Pure API call - used by server actions
 */
export async function signup(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(userData),
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Logout current session
 * Pure API call - revalidation handled by action layer
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/logout`, {
    method: 'POST',
    cache: 'no-store',
  })

  return await response.json()
}

/**
 * Logout from all devices
 * Pure API call - revalidation handled by action layer
 */
export async function logoutAll(): Promise<{ success: boolean; message?: string }> {
  const response = await serverFetch(`${BACKEND_URL}/api/auth/logout-all`, {
    method: 'POST',
    cache: 'no-store',
  })

  return await response.json()
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
    console.error('getUserByCustomerId error:', error)
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
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('exchangeMonoToken error:', error)
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
    console.error('importMonoAccount error:', error)
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
        body: JSON.stringify(options || {}),
        cache: 'no-store' 
      }
    )
    return await response.json()
  } catch (error: any) {
    console.error('syncMonoTransactions error:', error)
    return { success: false, message: error.message }
  }
}

export async function getMonoAccountIdentity(accountId: string): Promise<{
  success: boolean
  message?: string
  data?: {
    full_name: string
    email: string
    phone: string
    gender: string
    dob: string
    bvn: string
    marital_status: string
    address_line1: string
    address_line2: string
  }
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/identity/${accountId}`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoAccountIdentity error:', error)
    return { success: false, message: error.message }
  }
}

export async function getCustomerDetailsFromMono(): Promise<{
  success: boolean
  message?: string
  customerDetailsFromMono?: {
    full_name: string
    bvn: string
    phone: string
    gender: string
    dob: string
    address_line1: string
    address_line2?: string
    marital_status: string
    created_at: string
    updated_at: string
  } | null
  customerDetailsLastUpdated?: Date | null
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/session/customer-details`,
      { next: { tags: ['customer-details'] } }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getCustomerDetailsFromMono error:', error)
    return { success: false, message: error.message }
  }
}
