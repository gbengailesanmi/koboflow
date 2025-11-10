/**
 * Centralized Data Fetching Hooks
 * 
 * These hooks integrate Zustand store with API calls to:
 * - Prevent redundant API calls
 * - Cache data across components
 * - Automatically sync state
 * - Leverage API cache for better performance
 */

import { useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAppStore } from '@/store'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'

/**
 * Hook to fetch and manage accounts data
 * Only fetches if data is not already in store
 */
export function useAccountsData() {
  const accounts = useAppStore(state => state.accounts)
  const isLoading = useAppStore(state => state.accountsLoading)
  const error = useAppStore(state => state.accountsError)
  const setAccounts = useAppStore(state => state.setAccounts)
  const setLoading = useAppStore(state => state.setAccountsLoading)
  const setError = useAppStore(state => state.setAccountsError)

  const fetchAccounts = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (accounts && !force) {
      return accounts
    }

    setLoading(true)
    setError(null)

    try {
      const response: any = await apiClient.getAccounts()
      const accountsData = response.accounts || []
      setAccounts(accountsData)
      return accountsData
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load accounts'
      setError(errorMsg)
      console.error('Error fetching accounts:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [accounts, setAccounts, setLoading, setError])

  // Auto-fetch on mount if not already loaded
  useEffect(() => {
    if (!accounts && !isLoading) {
      fetchAccounts()
    }
  }, []) // Only run on mount

  return {
    accounts,
    isLoading,
    error,
    refetch: () => fetchAccounts(true),
  }
}

/**
 * Hook to fetch and manage transactions data
 * Only fetches if data is not already in store
 */
export function useTransactionsData() {
  const transactions = useAppStore(state => state.transactions)
  const isLoading = useAppStore(state => state.transactionsLoading)
  const error = useAppStore(state => state.transactionsError)
  const setTransactions = useAppStore(state => state.setTransactions)
  const setLoading = useAppStore(state => state.setTransactionsLoading)
  const setError = useAppStore(state => state.setTransactionsError)

  const fetchTransactions = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (transactions && !force) {
      return transactions
    }

    setLoading(true)
    setError(null)

    try {
      const response: any = await apiClient.getTransactions()
      const transactionsData = response.transactions || []
      setTransactions(transactionsData)
      return transactionsData
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load transactions'
      setError(errorMsg)
      console.error('Error fetching transactions:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [transactions, setTransactions, setLoading, setError])

  // Auto-fetch on mount if not already loaded
  useEffect(() => {
    if (!transactions && !isLoading) {
      fetchTransactions()
    }
  }, []) // Only run on mount

  return {
    transactions,
    isLoading,
    error,
    refetch: () => fetchTransactions(true),
  }
}

/**
 * Hook to fetch and manage budget data
 * Only fetches if data is not already in store
 */
export function useBudgetData() {
  const budget = useAppStore(state => state.budget)
  const isLoading = useAppStore(state => state.isLoading)
  const error = useAppStore(state => state.error)
  const setBudget = useAppStore(state => state.setBudget)

  const fetchBudget = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (budget && !force) {
      return budget
    }

    try {
      const response: any = await apiClient.getBudget()
      if (response.budget) {
        setBudget(response.budget)
        return response.budget
      }
      return null
    } catch (err: any) {
      console.error('Error fetching budget:', err)
      return null
    }
  }, [budget, setBudget])

  // Auto-fetch on mount if not already loaded
  useEffect(() => {
    if (!budget && !isLoading) {
      fetchBudget()
    }
  }, []) // Only run on mount

  return {
    budget,
    isLoading,
    error,
    refetch: () => fetchBudget(true),
  }
}

/**
 * Hook to fetch and manage categories data
 * Only fetches if data is not already in store
 */
export function useCategoriesData() {
  const categories = useAppStore(state => state.categories)
  const isLoading = useAppStore(state => state.isLoading)
  const error = useAppStore(state => state.error)
  const setCategories = useAppStore(state => state.setCategories)

  const fetchCategories = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (categories && !force) {
      return categories
    }

    try {
      const response: any = await apiClient.getCategories()
      if (response.categories) {
        setCategories(response.categories)
        return response.categories
      }
      return null
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      return null
    }
  }, [categories, setCategories])

  // Auto-fetch on mount if not already loaded
  useEffect(() => {
    if (!categories && !isLoading) {
      fetchCategories()
    }
  }, []) // Only run on mount

  return {
    categories,
    isLoading,
    error,
    refetch: () => fetchCategories(true),
  }
}

/**
 * Hook to fetch all essential data for dashboard/analytics
 * Fetches in parallel but only if data not already loaded
 */
export function useEssentialData() {
  const accountsHook = useAccountsData()
  const transactionsHook = useTransactionsData()

  const isLoading = accountsHook.isLoading || transactionsHook.isLoading
  const error = accountsHook.error || transactionsHook.error

  const refetchAll = useCallback(async () => {
    await Promise.all([
      accountsHook.refetch(),
      transactionsHook.refetch(),
    ])
  }, [accountsHook, transactionsHook])

  return {
    accounts: accountsHook.accounts,
    transactions: transactionsHook.transactions,
    isLoading,
    error,
    refetchAll,
  }
}
