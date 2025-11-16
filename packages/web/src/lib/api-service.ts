/**
 * CENTRALIZED API SERVICE
 * 
 * This is the ONLY file that should communicate with the backend.
 * All API calls go through here - both client-side and server-side.
 * 
 * RULES:
 * 1. No other file should make fetch() calls to the backend
 * 2. No other file should handle auth tokens or cookies
 * 3. All components get data through this service
 */

'use server'

import { cookies } from 'next/headers'
import type { UserProfile } from '@/types/user-profile'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ============================================================================
// TYPES
// ============================================================================

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  [key: string]: any
}

export interface SessionData {
  customerId: string
  email: string
  firstName?: string
  lastName?: string
  currency?: string
  totalBudgetLimit?: number
}

// ============================================================================
// CORE REQUEST FUNCTION (Server-side only)
// ============================================================================

/**
 * Cache strategies for different data types
 */
const CACHE_STRATEGIES = {
  // User data changes rarely, cache for 5 minutes
  SESSION: { next: { revalidate: 300, tags: ['session'] } } as const,
  
  // Settings change rarely, cache for 10 minutes
  SETTINGS: { next: { revalidate: 600, tags: ['settings'] } } as const,
  
  // Accounts update when user syncs, cache for 5 minutes
  ACCOUNTS: { next: { revalidate: 300, tags: ['accounts'] } } as const,
  
  // Transactions update when accounts sync, cache for 2 minutes
  TRANSACTIONS: { next: { revalidate: 120, tags: ['transactions'] } } as const,
  
  // Budget changes less frequently, cache for 5 minutes
  BUDGET: { next: { revalidate: 300, tags: ['budget'] } } as const,
  
  // Categories change rarely, cache for 10 minutes
  CATEGORIES: { next: { revalidate: 600, tags: ['categories'] } } as const,
  
  // No cache for auth/mutations
  NO_CACHE: { cache: 'no-store' as const } as const,
}

/**
 * Makes server-side API requests with authentication
 * This function runs on the server and uses server-side cookies
 */
async function serverRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheStrategy?: any // Use 'any' to bypass Next.js-specific type issues
): Promise<T | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      ...options,
      ...cacheStrategy, // Apply cache strategy
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Cookie: `auth-token=${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`API Request Failed [${endpoint}]:`, error)
    return null
  }
}

// ============================================================================
// SESSION & AUTH
// ============================================================================

/**
 * Get current user session
 * Cached for 5 minutes - revalidates automatically
 */
export async function getSession(): Promise<SessionData | null> {
  console.log('[API Service] getSession called')
  const data: any = await serverRequest('/api/session', {}, CACHE_STRATEGIES.SESSION)
  return data?.user || null
}

/**
 * Get formatted user profile with all necessary data
 */
export async function getUserProfile(): Promise<{
  profile: UserProfile
  customerId: string
} | null> {
  console.log('[API Service] getUserProfile called')
  const session = await getSession()

  if (!session) {
    return null
  }

  const profile: UserProfile = {
    name: `${session.firstName || ''} ${session.lastName || ''}`.trim(),
    email: session.email,
    currency: session.currency || 'SEK',
    totalBudgetLimit: session.totalBudgetLimit || 0,
  }

  return {
    profile,
    customerId: session.customerId,
  }
}

/**
 * Get full user data including settings and budget
 */
export async function getUserData(customerId: string) {
  console.log('[API Service] getUserData called for customerId:', customerId)
  const [session, budget, settings] = await Promise.all([
    getSession(),
    getBudget(),
    getSettings(),
  ])

  if (!session || session.customerId !== customerId) {
    return null
  }

  return {
    profile: {
      customerId: session.customerId,
      email: session.email,
      firstName: session.firstName || '',
      lastName: session.lastName || '',
      currency: session.currency || 'SEK',
    },
    totalBudgetLimit: budget?.totalBudgetLimit || 0,
    settings: settings?.settings || {},
  }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

/**
 * Get all user accounts
 * Cached for 5 minutes - revalidates when data changes
 */
export async function getAccounts(): Promise<any> {
  console.log('[API Service] getAccounts called')
  return await serverRequest('/api/accounts', {}, CACHE_STRATEGIES.ACCOUNTS)
}

/**
 * Refresh accounts data from bank
 * No cache - always fetches fresh data
 */
export async function refreshAccounts(): Promise<any> {
  console.log('[API Service] refreshAccounts called')
  return await serverRequest('/api/accounts/refresh', {
    method: 'POST',
  }, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function getTransactions(limit: number = 1000, skip: number = 0): Promise<any> {
  console.log('[API Service] getTransactions called with limit:', limit, 'skip:', skip)
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  })
  return await serverRequest(`/api/transactions?${params}`, {}, CACHE_STRATEGIES.TRANSACTIONS)
}

// ============================================================================
// BUDGET
// ============================================================================

/**
 * Get user budget
 * Cached for 5 minutes
 */
export async function getBudget(): Promise<any> {
  console.log('[API Service] getBudget called')
  return await serverRequest('/api/budget', {}, CACHE_STRATEGIES.BUDGET)
}

/**
 * Create new budget
 * No cache - mutation
 */
export async function createBudget(data: {
  totalBudgetLimit: number
  categories: any[]
  period?: any
}): Promise<any> {
  console.log('[API Service] createBudget called with data:', { totalBudgetLimit: data.totalBudgetLimit, categoriesCount: data.categories.length })
  return await serverRequest('/api/budget', {
    method: 'POST',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Update existing budget
 * No cache - mutation
 */
export async function updateBudget(data: Partial<{
  totalBudgetLimit: number
  categories: any[]
  period: any
}>): Promise<any> {
  console.log('[API Service] updateBudget called')
  return await serverRequest('/api/budget', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Get all categories
 * Cached for 10 minutes - changes rarely
 */
export async function getCategories(): Promise<any> {
  console.log('[API Service] getCategories called')
  return await serverRequest('/api/categories', {}, CACHE_STRATEGIES.CATEGORIES)
}

/**
 * Create new category
 * No cache - mutation
 */
export async function createCategory(data: {
  name: string
  keywords: string[]
  color?: string
}): Promise<any> {
  console.log('[API Service] createCategory called:', data.name)
  return await serverRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Update category
 * No cache - mutation
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string
    keywords?: string[]
    color?: string
  }
): Promise<any> {
  console.log('[API Service] updateCategory called for id:', id)
  return await serverRequest(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Delete category
 * No cache - mutation
 */
export async function deleteCategory(id: string): Promise<any> {
  console.log('[API Service] deleteCategory called for id:', id)
  return await serverRequest(`/api/categories/${id}`, {
    method: 'DELETE',
  }, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Get user settings
 * Cached for 10 minutes - changes rarely
 */
export async function getSettings(): Promise<any> {
  console.log('[API Service] getSettings called')
  return await serverRequest('/api/settings', {}, CACHE_STRATEGIES.SETTINGS)
}

/**
 * Update user settings
 * No cache - mutation
 */
export async function updateSettings(data: any): Promise<any> {
  console.log('[API Service] updateSettings called')
  return await serverRequest('/api/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Delete user account
 * No cache - mutation
 */
export async function deleteAccount(customerId?: string): Promise<any> {
  console.log('[API Service] deleteAccount called for customerId:', customerId)
  return await serverRequest('/api/settings/account', {
    method: 'DELETE',
    body: customerId ? JSON.stringify({ customerId }) : undefined,
  }, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Update user profile
 * No cache - mutation
 */
export async function updateProfile(
  customerId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    currency?: string
    totalBudgetLimit?: number
  }
): Promise<ApiResponse> {
  console.log('[API Service] updateProfile called for customerId:', customerId)
  const result = await serverRequest<ApiResponse>(`/api/auth/user/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
  return result || { success: false, message: 'Update failed' }
}

// ============================================================================
// AUTH (No cache for any auth operations)
// ============================================================================

/**
 * Sign up new user
 * No cache - mutation
 */
export async function signup(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<any> {
  console.log('[API Service] signup called for email:', data.email)
  return await serverRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Login user
 * No cache - mutation
 */
export async function login(data: {
  email: string
  password: string
}): Promise<any> {
  console.log('[API Service] login called for email:', data.email)
  return await serverRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Verify email
 * No cache - mutation
 */
export async function verifyEmail(token: string): Promise<any> {
  console.log('[API Service] verifyEmail called')
  return await serverRequest('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Resend verification email
 * No cache - mutation
 */
export async function resendVerification(email: string): Promise<any> {
  console.log('[API Service] resendVerification called for email:', email)
  return await serverRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, CACHE_STRATEGIES.NO_CACHE)
}

/**
 * Logout user
 * No cache - mutation
 */
export async function logout(): Promise<any> {
  console.log('[API Service] logout called')
  return await serverRequest('/api/auth/logout', {
    method: 'POST',
  }, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// TINK CALLBACK
// ============================================================================

/**
 * Handle Tink OAuth callback
 * No cache - mutation
 */
export async function handleTinkCallback(code: string): Promise<any> {
  console.log('[API Service] handleTinkCallback called')
  return await serverRequest(`/api/callback?code=${code}`, {}, CACHE_STRATEGIES.NO_CACHE)
}

// ============================================================================
// CACHE REVALIDATION
// ============================================================================

/**
 * Manually revalidate specific cache tags
 * Use this after mutations to force cache refresh
 */
export async function revalidateCache(tags: string[]) {
  'use server'
  console.log('[API Service] revalidateCache called for tags:', tags)
  const { revalidateTag } = await import('next/cache')
  tags.forEach(tag => revalidateTag(tag))
}

/**
 * Revalidate all session-related data
 */
export async function revalidateSession() {
  console.log('[API Service] revalidateSession called')
  await revalidateCache(['session'])
}

/**
 * Revalidate all financial data
 */
export async function revalidateFinancialData() {
  console.log('[API Service] revalidateFinancialData called')
  await revalidateCache(['accounts', 'transactions', 'budget'])
}

/**
 * Revalidate everything (use sparingly)
 */
export async function revalidateAll() {
  console.log('[API Service] revalidateAll called')
  await revalidateCache(['session', 'accounts', 'transactions', 'budget', 'categories', 'settings'])
}
