import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'

type DashboardData = {
  profile: {
    name: string
    email: string
    currency: string
    totalBudgetLimit: number
    customerId: string
  } | null
  accounts: Account[]
  transactions: Transaction[]
}

type UseDashboardDataReturn = {
  data: DashboardData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch dashboard data with automatic caching at API level
 * The API client automatically caches GET requests and invalidates on mutations
 */
export function useDashboardData(customerId: string): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    accounts: [],
    transactions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching dashboard data (with API-level caching)')
      
      // Fetch all data in parallel - API client handles caching automatically
      const [sessionRes, accountsRes, transactionsRes]: any[] = await Promise.all([
        apiClient.getSession(),
        apiClient.getAccounts(),
        apiClient.getTransactions(),
      ])

      if (!sessionRes.success || sessionRes.user?.customerId !== customerId) {
        throw new Error('Session invalid')
      }

      const newData: DashboardData = {
        profile: {
          name: `${sessionRes.user.firstName} ${sessionRes.user.lastName}`,
          email: sessionRes.user.email,
          currency: sessionRes.user.currency || 'SEK',
          totalBudgetLimit: sessionRes.user.totalBudgetLimit || 0,
          customerId: sessionRes.user.customerId
        },
        accounts: accountsRes.accounts || [],
        transactions: transactionsRes.transactions || []
      }

      setData(newData)
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err)
      setError(err.message || 'Failed to load dashboard')
      
      // If auth error, redirect to login
      if (err.message === 'Session invalid') {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    } finally {
      setLoading(false)
    }
  }, [customerId])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}
