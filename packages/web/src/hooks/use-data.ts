'use client'

import useSWR from 'swr'
import { cachedSWR, fetcher, transactionsSWR } from '@/lib/swr'
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
  return useSWR<Account[]>(
    '/api/accounts',
    fetcher,
    cachedSWR
  )
}

export function useTransactions() {
  return useSWR<EnrichedTransaction[]>(
    '/api/transactions',
    fetcher,
    transactionsSWR
  )
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
