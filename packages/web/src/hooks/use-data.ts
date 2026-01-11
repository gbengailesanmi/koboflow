'use client'

import useSWR from 'swr'
import { cachedSWR, fetcher } from '@/lib/swr'
import type { Account, EnrichedTransaction, CustomCategory, Budget } from '@koboflow/shared'

interface BudgetResponse {
  totalBudgetLimit: number
  categories: any[]
}

interface Session {
  sessionId: string
  createdAt: Date | string
  expiresAt: Date | string
  lastActivity?: Date | string
  userAgent?: string
}

interface ActiveSessionsResponse {
  success: boolean
  sessions?: Session[]
  error?: string
}

export function useAccounts() {
  const result = useSWR<Account[]>(
    '/api/accounts',
    fetcher,
    cachedSWR
  )
  
  console.log('[useAccounts] Hook result:', {
    data: result.data ? `${result.data.length} accounts` : 'undefined',
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error?.message
  })
  
  return result
}

export function useTransactions() {
  const result = useSWR<EnrichedTransaction[]>(
    '/api/transactions',
    fetcher,
    cachedSWR
  )
  
  console.log('[useTransactions] Hook result:', {
    data: result.data ? `${result.data.length} transactions` : 'undefined',
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error?.message
  })
  
  return result
}

export function useCustomCategories() {
  return useSWR<CustomCategory[]>(
    '/api/categories/custom',
    fetcher,
    cachedSWR
  )
}

export function useBudgets() {
  return useSWR<Budget[]>(
    '/api/budget',
    fetcher,
    cachedSWR
  )
}

export function useBudget() {
  return useSWR<BudgetResponse>(
    '/api/budget/current',
    fetcher,
    cachedSWR
  )
}

export function useActiveSessions() {
  return useSWR<ActiveSessionsResponse>(
    '/api/sessions/active',
    fetcher,
    cachedSWR
  )
}
