import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'

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

export function useAccounts() {
  return useApiData<{ accounts: Account[] }>(
    () => apiClient.getAccounts() as Promise<{ accounts: Account[] }>
  )
}

export function useTransactions() {
  return useApiData<{ transactions: Transaction[] }>(
    () => apiClient.getTransactions() as Promise<{ transactions: Transaction[] }>
  )
}

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

export function useBudget() {
  return useApiData<any>(
    () => apiClient.getBudget() as Promise<any>
  )
}

export function useCategories() {
  return useApiData<any>(
    () => apiClient.getCategories() as Promise<any>
  )
}

export function useSettings() {
  return useApiData<any>(
    () => apiClient.getSettings()
  )
}

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
