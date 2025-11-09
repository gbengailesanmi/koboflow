import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { apiClient } from '@/lib/api-client'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import type { Budget } from '@/types/budget'
import type { User } from '@/store/sessionSlice'

/**
 * Hook to fetch and manage accounts with Zustand
 * Automatically caches in store and persists to localStorage
 */
export function useAccounts() {
  const accounts = useAppStore((state: any) => state.accounts)
  const isLoading = useAppStore((state: any) => state.accountsLoading)
  const error = useAppStore((state: any) => state.accountsError)
  const setAccounts = useAppStore((state: any) => state.setAccounts)
  const setLoading = useAppStore((state: any) => state.setAccountsLoading)
  const setError = useAppStore((state: any) => state.setAccountsError)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getAccounts() as { accounts: Account[] }
      setAccounts(response.accounts)
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err)
      setError(err.message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [setAccounts, setLoading, setError])

  const refetch = useCallback(async () => {
    await fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!accounts && !isLoading) {
      fetchAccounts()
    }
  }, []) // Empty deps - only run once on mount

  return { 
    accounts, 
    isLoading, 
    error, 
    refetch 
  }
}

/**
 * Hook to fetch and manage transactions with Zustand
 * Automatically caches in store and persists to localStorage
 */
export function useTransactions() {
  const transactions = useAppStore((state: any) => state.transactions)
  const isLoading = useAppStore((state: any) => state.transactionsLoading)
  const error = useAppStore((state: any) => state.transactionsError)
  const setTransactions = useAppStore((state: any) => state.setTransactions)
  const setLoading = useAppStore((state: any) => state.setTransactionsLoading)
  const setError = useAppStore((state: any) => state.setTransactionsError)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getTransactions() as { transactions: Transaction[] }
      setTransactions(response.transactions)
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err)
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [setTransactions, setLoading, setError])

  const refetch = useCallback(async () => {
    await fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!transactions && !isLoading) {
      fetchTransactions()
    }
  }, []) // Empty deps - only run once on mount

  return { 
    transactions, 
    isLoading, 
    error, 
    refetch 
  }
}

/**
 * Hook to fetch and manage budget with Zustand
 * Automatically caches in store and persists to localStorage
 */
export function useBudget() {
  const budget = useAppStore((state: any) => state.budget)
  const isLoading = useAppStore((state: any) => state.isLoading)
  const error = useAppStore((state: any) => state.error)
  const setBudget = useAppStore((state: any) => state.setBudget)
  const setLoading = useAppStore((state: any) => state.setLoading)
  const setError = useAppStore((state: any) => state.setError)

  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getBudget() as Budget
      setBudget(response)
    } catch (err: any) {
      console.error('Failed to fetch budget:', err)
      setError(err.message || 'Failed to load budget')
    } finally {
      setLoading(false)
    }
  }, [setBudget, setLoading, setError])

  const refetch = useCallback(async () => {
    await fetchBudget()
  }, [fetchBudget])

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!budget && !isLoading) {
      fetchBudget()
    }
  }, []) // Empty deps - only run once on mount

  return { 
    budget, 
    isLoading, 
    error, 
    refetch 
  }
}

/**
 * Hook to fetch and manage session with Zustand
 * Automatically caches in store and persists to localStorage
 */
export function useSession() {
  const user = useAppStore((state: any) => state.user)
  const isAuthenticated = useAppStore((state: any) => state.isAuthenticated)
  const isLoading = useAppStore((state: any) => state.isLoading)
  const error = useAppStore((state: any) => state.error)
  const setUser = useAppStore((state: any) => state.setUser)
  const setLoading = useAppStore((state: any) => state.setLoading)
  const setError = useAppStore((state: any) => state.setError)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getSession() as {
        success: boolean
        user: User
      }
      if (response.success && response.user) {
        setUser(response.user)
      }
    } catch (err: any) {
      console.error('Failed to fetch session:', err)
      setError(err.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading, setError])

  const refetch = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!user && !isLoading) {
      fetchSession()
    }
  }, []) // Empty deps - only run once on mount

  return { 
    user,
    isAuthenticated,
    isLoading, 
    error, 
    refetch 
  }
}

/**
 * Hook for logout with store cleanup
 */
export function useLogout() {
  const clearAccounts = useAppStore((state: any) => state.clearAccounts)
  const clearTransactions = useAppStore((state: any) => state.clearTransactions)
  const clearBudget = useAppStore((state: any) => state.clearBudget)
  const clearSession = useAppStore((state: any) => state.clearSession)
  const clearCategories = useAppStore((state: any) => state.clearCategories)
  const clearAnalytics = useAppStore((state: any) => state.clearAnalytics)

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
      
      // Clear all store data
      clearAccounts()
      clearTransactions()
      clearBudget()
      clearSession()
      clearCategories()
      clearAnalytics()
    } catch (err) {
      console.error('Logout error:', err)
      throw err
    }
  }, [clearAccounts, clearTransactions, clearBudget, clearSession, clearCategories, clearAnalytics])

  return { logout }
}

/**
 * Hook to refresh accounts (mutation)
 */
export function useRefreshAccounts() {
  const setAccounts = useAppStore((state: any) => state.setAccounts)
  const setTransactions = useAppStore((state: any) => state.setTransactions)
  const setBudget = useAppStore((state: any) => state.setBudget)

  const refreshAccounts = useCallback(async () => {
    try {
      const response = await apiClient.refreshAccounts() as { accounts: Account[] }
      setAccounts(response.accounts)
      
      // Also refetch transactions and budget since they may have changed
      const transactionsResponse = await apiClient.getTransactions() as { transactions: Transaction[] }
      setTransactions(transactionsResponse.transactions)
      
      const budgetResponse = await apiClient.getBudget() as Budget
      setBudget(budgetResponse)
      
      return response
    } catch (err) {
      console.error('Failed to refresh accounts:', err)
      throw err
    }
  }, [setAccounts, setTransactions, setBudget])

  return { refreshAccounts }
}
