'use server'

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

// Settings type alias
export type Settings = UserSettings

const BACKEND_URL = config.BACKEND_URL

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Server-side fetch helper with session cookie forwarding
 * Automatically includes session-id cookie from Next.js server context
 */
async function serverFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session-id')?.value

  const headers = new Headers(options.headers)
  
  if (sessionId) {
    headers.set('Cookie', `session-id=${sessionId}`)
  }

  // Default to JSON content type if body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    // Next.js 15 caching - default to cache with revalidation
    cache: options.cache || 'force-cache',
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

// ============================================================================
// Session / Authentication (GET)
// ============================================================================

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

// ============================================================================
// Accounts (GET)
// ============================================================================

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

    const data = await parseResponse<{ success: boolean; accounts: Account[] }>(response)
    return data.accounts || []
  } catch (error) {
    console.error('getAccounts error:', error)
    return []
  }
}

// ============================================================================
// Transactions (GET)
// ============================================================================

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

    const data = await parseResponse<{ success: boolean; transactions: Transaction[] }>(response)
    return data.transactions || []
  } catch (error) {
    console.error('getTransactions error:', error)
    return []
  }
}

// ============================================================================
// Budget (GET)
// ============================================================================

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

// ============================================================================
// Settings (GET)
// ============================================================================

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

// ============================================================================
// Categories (GET)
// ============================================================================

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

// ============================================================================
// Authentication Mutations (Server Actions)
// ============================================================================

/**
 * Login user
 * Pure API call - revalidation handled by action layer
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
 * Pure API call - no revalidation needed (user must verify email first)
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

// ============================================================================
// Budget Mutations (Server Actions)
// ============================================================================

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

// ============================================================================
// Settings Mutations (Server Actions)
// ============================================================================

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

// ============================================================================
// PIN Management (Server Actions)
// ============================================================================

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

// ============================================================================
// Password Management (Server Actions)
// ============================================================================

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

// ============================================================================
// Category Mutations (Server Actions)
// ============================================================================

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

// ============================================================================
// User Profile Mutations (Server Actions)
// ============================================================================

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

// ============================================================================
// Mono Integration (Nigerian Banks)
// ============================================================================

// --- Config ---

/** GET /api/mono/config - Get Mono public key for widget */
export async function getMonoConfig(): Promise<{
  success: boolean
  publicKey?: string
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/config`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoConfig error:', error)
    return { success: false, message: error.message }
  }
}

// --- Account Connection ---

/** POST /api/mono/connect - Exchange widget code for account + transactions */
export async function connectMonoAccount(code: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
  account?: { name: string; institution: string; type: string }
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/connect`, {
      method: 'POST',
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('connectMonoAccount error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/link - Link account using Mono Customer/Account ID */
export async function linkMonoAccount(
  monoCustomerId: string,
  monoAccountId?: string
): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
  accounts?: Array<{
    name: string
    institution: string
    type: string
    transactionsCount: number
    error?: string
    note?: string
  }>
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/link`, {
      method: 'POST',
      body: JSON.stringify({ monoCustomerId, monoAccountId }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('linkMonoAccount error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/link-all - Link all accounts for a Mono customer */
export async function linkAllMonoAccounts(monoCustomerId: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
  accounts?: Array<{
    name: string
    institution: string
    type: string
    transactionsCount: number
    error?: string
  }>
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/link-all`, {
      method: 'POST',
      body: JSON.stringify({ monoCustomerId }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('linkAllMonoAccounts error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/initiate - Initiate account linking (server-side flow) */
export async function initiateMonoLinking(redirectUrl: string): Promise<{
  success: boolean
  message?: string
  monoUrl?: string
  reference?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/initiate`, {
      method: 'POST',
      body: JSON.stringify({ redirectUrl }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('initiateMonoLinking error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/reauth - Initiate account reauthorization */
export async function initiateMonoReauth(
  accountId: string,
  redirectUrl: string
): Promise<{
  success: boolean
  message?: string
  monoUrl?: string
  reference?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/reauth`, {
      method: 'POST',
      body: JSON.stringify({ accountId, redirectUrl }),
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('initiateMonoReauth error:', error)
    return { success: false, message: error.message }
  }
}

// --- Account Management ---

/** GET /api/mono/accounts - Get user's linked Mono accounts */
export async function getMonoAccounts(): Promise<{
  success: boolean
  message?: string
  accounts?: any[]
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/accounts`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoAccounts error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/all-accounts - Get all accounts from Mono (admin) */
export async function getAllMonoAccounts(): Promise<{
  success: boolean
  message?: string
  accounts?: any[]
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/all-accounts`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getAllMonoAccounts error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/customer/:monoCustomerId/accounts - Get accounts by Mono customer ID */
export async function getMonoAccountsByCustomer(monoCustomerId: string): Promise<{
  success: boolean
  message?: string
  accounts?: any[]
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/customer/${monoCustomerId}/accounts`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoAccountsByCustomer error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/sync/:accountId - Trigger manual sync */
export async function syncMonoAccount(accountId: string): Promise<{
  success: boolean
  message?: string
  status?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/sync/${accountId}`, {
      method: 'POST',
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('syncMonoAccount error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/refresh/:accountId - Refresh account data + transactions */
export async function refreshMonoAccount(accountId: string): Promise<{
  success: boolean
  message?: string
  transactionsCount?: number
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/refresh/${accountId}`, {
      method: 'POST',
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('refreshMonoAccount error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/balance/:accountId - Get real-time balance */
export async function getMonoBalance(accountId: string): Promise<{
  success: boolean
  message?: string
  balance?: {
    ledgerBalance: number
    availableBalance: number
    currency: string
  }
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/balance/${accountId}`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoBalance error:', error)
    return { success: false, message: error.message }
  }
}

/** DELETE /api/mono/unlink/:accountId - Unlink account */
export async function unlinkMonoAccount(accountId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/unlink/${accountId}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('unlinkMonoAccount error:', error)
    return { success: false, message: error.message }
  }
}

// --- Account Data ---

/** GET /api/mono/identity/:accountId - Get account identity info */
export async function getMonoIdentity(accountId: string): Promise<{
  success: boolean
  message?: string
  identity?: any
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/identity/${accountId}`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoIdentity error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/transactions/:accountId - Get transactions */
export async function getMonoTransactions(
  accountId: string,
  options?: { start?: string; end?: string; type?: 'debit' | 'credit'; narration?: string }
): Promise<{
  success: boolean
  message?: string
  transactions?: any[]
  meta?: any
}> {
  try {
    const params = new URLSearchParams()
    if (options?.start) params.append('start', options.start)
    if (options?.end) params.append('end', options.end)
    if (options?.type) params.append('type', options.type)
    if (options?.narration) params.append('narration', options.narration)

    const query = params.toString()
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/transactions/${accountId}${query ? `?${query}` : ''}`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoTransactions error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/statement/:accountId - Get account statement */
export async function getMonoStatement(
  accountId: string,
  period: 'last1month' | 'last2months' | 'last3months' | 'last6months' | 'last12months',
  output?: 'json' | 'pdf'
): Promise<{
  success: boolean
  message?: string
  statement?: any
}> {
  try {
    const params = new URLSearchParams({ period })
    if (output) params.append('output', output)

    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/statement/${accountId}?${params.toString()}`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoStatement error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/statement/:accountId/job/:jobId - Get statement job status */
export async function getMonoStatementJobStatus(
  accountId: string,
  jobId: string
): Promise<{
  success: boolean
  message?: string
  job?: any
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/statement/${accountId}/job/${jobId}`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoStatementJobStatus error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/creditworthiness/:accountId - Get credit score */
export async function getMonoCreditworthiness(
  accountId: string,
  data: {
    bvn: string
    principal: number
    interestRate: number
    term: number
    runCreditCheck: boolean
  }
): Promise<{
  success: boolean
  message?: string
  creditworthiness?: any
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/creditworthiness/${accountId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        cache: 'no-store',
      }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoCreditworthiness error:', error)
    return { success: false, message: error.message }
  }
}

// --- Investments ---

/** GET /api/mono/earnings/:accountId - Get investment earnings */
export async function getMonoEarnings(accountId: string): Promise<{
  success: boolean
  message?: string
  earnings?: any
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/earnings/${accountId}`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoEarnings error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/assets/:accountId - Get investment assets */
export async function getMonoAssets(accountId: string): Promise<{
  success: boolean
  message?: string
  assets?: any
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/assets/${accountId}`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoAssets error:', error)
    return { success: false, message: error.message }
  }
}

// --- Enrichment ---

/** GET /api/mono/categorisation/:accountId - Get transaction categories */
export async function getMonoCategorisation(accountId: string): Promise<{
  success: boolean
  message?: string
  categorisation?: any
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/categorisation/${accountId}`,
      { cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('getMonoCategorisation error:', error)
    return { success: false, message: error.message }
  }
}

/** GET /api/mono/insights/:accountId - Get statement insights */
export async function getMonoInsights(accountId: string): Promise<{
  success: boolean
  message?: string
  insights?: any
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/insights/${accountId}`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoInsights error:', error)
    return { success: false, message: error.message }
  }
}

// --- Notifications ---

/** GET /api/mono/notifications - Get user notifications */
export async function getMonoNotifications(): Promise<{
  success: boolean
  message?: string
  notifications?: Array<{
    id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    read: boolean
    createdAt: string
    metadata?: any
  }>
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/notifications`, {
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('getMonoNotifications error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/notifications/:notificationId/read - Mark notification as read */
export async function markMonoNotificationRead(notificationId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const response = await serverFetch(
      `${BACKEND_URL}/api/mono/notifications/${notificationId}/read`,
      { method: 'POST', cache: 'no-store' }
    )
    return await response.json()
  } catch (error: any) {
    console.error('markMonoNotificationRead error:', error)
    return { success: false, message: error.message }
  }
}

/** POST /api/mono/notifications/read-all - Mark all notifications as read */
export async function markAllMonoNotificationsRead(): Promise<{
  success: boolean
  message?: string
  count?: number
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/mono/notifications/read-all`, {
      method: 'POST',
      cache: 'no-store',
    })
    return await response.json()
  } catch (error: any) {
    console.error('markAllMonoNotificationsRead error:', error)
    return { success: false, message: error.message }
  }
}
