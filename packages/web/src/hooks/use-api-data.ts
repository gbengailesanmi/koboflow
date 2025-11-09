import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'

/**
 * Generic hook for fetching and caching API data
 * All data is cached automatically at the API client level
 */
function useApiData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (err: any) {
      console.error('API fetch error:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [fetchFn, ...deps])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

/**
 * Hook to fetch accounts (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useAccounts() {
  return useApiData<{ accounts: Account[] }>(
    () => apiClient.getAccounts() as Promise<{ accounts: Account[] }>
  )
}

/**
 * Hook to fetch transactions (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useTransactions() {
  return useApiData<{ transactions: Transaction[] }>(
    () => apiClient.getTransactions() as Promise<{ transactions: Transaction[] }>
  )
}

/**
 * Hook to fetch session/profile (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useSession() {
  return useApiData<{
    success: boolean
    user: {
      customerId: string
      firstName: string
      lastName: string
      email: string
      currency: string
      totalBudgetLimit: number
    }
  }>(
    () => apiClient.getSession() as Promise<{
      success: boolean
      user: {
        customerId: string
        firstName: string
        lastName: string
        email: string
        currency: string
        totalBudgetLimit: number
      }
    }>
  )
}

/**
 * Hook to fetch budget (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useBudget() {
  return useApiData<any>(
    () => apiClient.getBudget() as Promise<any>
  )
}

/**
 * Hook to fetch categories (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useCategories() {
  return useApiData<any>(
    () => apiClient.getCategories() as Promise<any>
  )
}

/**
 * Hook to fetch settings (cached at API level)
 * Can be used anywhere in the app - cache is shared globally
 */
export function useSettings() {
  return useApiData<any>(
    () => apiClient.getSettings()
  )
}

/**
 * Example: Combined hook that uses multiple cached endpoints
 * All individual calls are cached, so this is very efficient
 */
export function useCompleteProfile() {
  const { data: session, loading: sessionLoading, error: sessionError } = useSession()
  const { data: settings, loading: settingsLoading, error: settingsError } = useSettings()
  const { data: budget, loading: budgetLoading, error: budgetError } = useBudget()

  return {
    data: {
      session: session?.user || null,
      settings: settings || null,
      budget: budget || null
    },
    loading: sessionLoading || settingsLoading || budgetLoading,
    error: sessionError || settingsError || budgetError
  }
}
