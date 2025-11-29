'use server'

import { cookies } from 'next/headers'
import { revalidateTag, revalidatePath } from 'next/cache'
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
 * Revalidates: After Tink callback imports new accounts
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
 * Revalidates: After create, update, delete transaction, or Tink callback
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
 * Get budget for current user
 * Cache tag: 'budget'
 * Revalidates: After budget POST or PATCH
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
 * Get custom categories for current user
 * Cache tag: 'categories'
 * Revalidates: After category POST, PATCH, DELETE
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/categories`, {
      next: { tags: ['categories'] },
    })

    const data = await parseResponse<CustomCategory[]>(response)
    return data || []
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
 * Revalidates: 'session' tag
 */
export async function login(email: string, password: string): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('login error:', error)
    return {
      success: false,
      message: error.message || 'Login failed',
    }
  }
}

/**
 * Signup new user
 * No revalidation needed (user must verify email first)
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
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(userData),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    console.error('signup error:', error)
    return {
      success: false,
      message: error.message || 'Signup failed',
    }
  }
}

/**
 * Logout current session
 * Revalidates: 'session', 'sessions-list' tags
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('session')
      revalidateTag('sessions-list')
    }

    return data
  } catch (error: any) {
    console.error('logout error:', error)
    return {
      success: false,
      message: error.message || 'Logout failed',
    }
  }
}

/**
 * Logout from all devices
 * Revalidates: 'session', 'sessions-list' tags
 */
export async function logoutAll(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/logout-all`, {
      method: 'POST',
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('session')
      revalidateTag('sessions-list')
    }

    return data
  } catch (error: any) {
    console.error('logoutAll error:', error)
    return {
      success: false,
      message: error.message || 'Logout all failed',
    }
  }
}

/**
 * Verify email with token
 * Revalidates: 'session' tag
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean
  message?: string
  customerId?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('verifyEmail error:', error)
    return {
      success: false,
      message: error.message || 'Email verification failed',
    }
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    console.error('resendVerificationEmail error:', error)
    return {
      success: false,
      message: error.message || 'Failed to resend verification email',
    }
  }
}

// ============================================================================
// Budget Mutations (Server Actions)
// ============================================================================

/**
 * Create or fully replace budget
 * Revalidates: 'budget', 'session' tags
 */
export async function updateBudget(
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/budget`, {
      method: 'POST',
      body: JSON.stringify({ totalBudgetLimit, categories, period }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('budget')
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('updateBudget error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update budget',
    }
  }
}

/**
 * Partially update budget (PATCH)
 * Revalidates: 'budget', 'session' tags
 */
export async function patchBudget(updates: {
  totalBudgetLimit?: number
  categories?: CategoryBudget[]
  period?: BudgetPeriod
}): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/budget`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('budget')
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('patchBudget error:', error)
    return {
      success: false,
      message: error.message || 'Failed to patch budget',
    }
  }
}

// ============================================================================
// Settings Mutations (Server Actions)
// ============================================================================

/**
 * Update user settings
 * Revalidates: 'settings', 'session' tags
 */
export async function updateSettings(settings: Partial<UserSettings>): Promise<{
  success: boolean
  message?: string
  settings?: UserSettings
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('settings')
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('updateSettings error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update settings',
    }
  }
}

/**
 * Delete user account and all associated data
 * Revalidates: All tags
 */
export async function deleteAccount(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings/account`, {
      method: 'DELETE',
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      // Revalidate everything since user is deleted
      revalidateTag('session')
      revalidateTag('accounts')
      revalidateTag('transactions')
      revalidateTag('budget')
      revalidateTag('settings')
      revalidateTag('categories')
      revalidateTag('sessions-list')
    }

    return data
  } catch (error: any) {
    console.error('deleteAccount error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete account',
    }
  }
}

// ============================================================================
// PIN Management (Server Actions)
// ============================================================================

/**
 * Set a new PIN (first-time setup)
 * Revalidates: 'settings' tag
 * @param pin - 4-6 digit PIN
 * @param password - User's account password for encryption
 */
export async function setUserPIN(pin: string, password: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/set`, {
      method: 'POST',
      body: JSON.stringify({ pin, password }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('settings')
    }

    return data
  } catch (error: any) {
    console.error('setUserPIN error:', error)
    return {
      success: false,
      message: error.message || 'Failed to set PIN',
    }
  }
}

/**
 * Change existing PIN
 * Revalidates: 'settings' tag
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
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/change`, {
      method: 'POST',
      body: JSON.stringify({ oldPin, newPin, password }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('settings')
    }

    return data
  } catch (error: any) {
    console.error('changeUserPIN error:', error)
    return {
      success: false,
      message: error.message || 'Failed to change PIN',
    }
  }
}

/**
 * Verify if a PIN is correct
 * No revalidation needed (read-only operation)
 * @param pin - PIN to verify
 * @param password - User's account password
 */
export async function verifyUserPIN(pin: string, password: string): Promise<{
  success: boolean
  valid?: boolean
  message?: string
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings/pin/verify`, {
      method: 'POST',
      body: JSON.stringify({ pin, password }),
      cache: 'no-store',
    })

    return await response.json()
  } catch (error: any) {
    console.error('verifyUserPIN error:', error)
    return {
      success: false,
      message: error.message || 'Failed to verify PIN',
    }
  }
}

// ============================================================================
// Password Management (Server Actions)
// ============================================================================

/**
 * Change user password (automatically re-encrypts PIN if set)
 * Revalidates: 'settings', 'session' tags
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
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/settings/password/change`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('settings')
      revalidateTag('session')
    }

    return data
  } catch (error: any) {
    console.error('changeUserPassword error:', error)
    return {
      success: false,
      message: error.message || 'Failed to change password',
    }
  }
}

// ============================================================================
// Category Mutations (Server Actions)
// ============================================================================

/**
 * Create custom category
 * Revalidates: 'categories' tag
 */
export async function createCustomCategory(categoryData: {
  name: string
  keywords: string[]
  color?: string
}): Promise<CustomCategory | null> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
      cache: 'no-store',
    })

    const data = await parseResponse<CustomCategory>(response)
    revalidateTag('categories')
    return data
  } catch (error: any) {
    console.error('createCustomCategory error:', error)
    return null
  }
}

/**
 * Update custom category
 * Revalidates: 'categories' tag
 */
export async function updateCustomCategory(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
): Promise<{ success: boolean }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      cache: 'no-store',
    })

    const data = await parseResponse<{ success: boolean }>(response)
    
    if (data.success) {
      revalidateTag('categories')
    }

    return data
  } catch (error: any) {
    console.error('updateCustomCategory error:', error)
    return { success: false }
  }
}

/**
 * Delete custom category
 * Revalidates: 'categories' tag
 */
export async function deleteCustomCategory(categoryId: string): Promise<{ success: boolean }> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
      cache: 'no-store',
    })

    const data = await parseResponse<{ success: boolean }>(response)
    
    if (data.success) {
      revalidateTag('categories')
    }

    return data
  } catch (error: any) {
    console.error('deleteCustomCategory error:', error)
    return { success: false }
  }
}

// ============================================================================
// User Profile Mutations (Server Actions)
// ============================================================================

/**
 * Update user profile
 * Revalidates: 'session', 'budget' tags
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
  try {
    // Use the auth PATCH endpoint to update user profile in the users collection
    const response = await serverFetch(`${BACKEND_URL}/api/auth/user/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      // Revalidate cache
      revalidateTag('session')
      if (updates.totalBudgetLimit !== undefined) {
        revalidateTag('budget')
      }
    }

    return data
  } catch (error: any) {
    console.error('updateUserProfile error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    }
  }
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
// Tink Callback (Server Action)
// ============================================================================

/**
 * Process Tink OAuth callback to import accounts and transactions
 * Revalidates: 'accounts', 'transactions' tags
 */
export async function processTinkCallback(code: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
}> {
  try {
    const response = await serverFetch(`${BACKEND_URL}/api/callback?code=${code}`, {
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return data
  } catch (error: any) {
    console.error('processTinkCallback error:', error)
    return {
      success: false,
      message: error.message || 'Failed to process bank data',
    }
  }
}
