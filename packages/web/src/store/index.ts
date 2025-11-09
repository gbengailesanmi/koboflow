import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createAccountsSlice, type AccountsSlice } from './accountsSlice'
import { createTransactionsSlice, type TransactionsSlice } from './transactionsSlice'
import { createBudgetSlice, type BudgetSlice } from './budgetSlice'
import { createSessionSlice, type SessionSlice } from './sessionSlice'
import { createCategoriesSlice, type CategoriesSlice } from './categoriesSlice'
import { createAnalyticsSlice, type AnalyticsSlice } from './analyticsSlice'

export type AppStore = AccountsSlice & 
  TransactionsSlice & 
  BudgetSlice & 
  SessionSlice & 
  CategoriesSlice & 
  AnalyticsSlice

/**
 * Main Zustand Store
 * 
 * Features:
 * - Centralized state management for all app data
 * - Automatic persistence to localStorage
 * - Redux DevTools integration for debugging
 * - Type-safe slices for different data domains
 * 
 * Usage:
 * ```tsx
 * import { useAppStore } from '@/store'
 * 
 * function MyComponent() {
 *   const accounts = useAppStore(state => state.accounts)
 *   const setAccounts = useAppStore(state => state.setAccounts)
 *   
 *   return <div>{accounts?.length} accounts</div>
 * }
 * ```
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set: any, get: any) => ({
        ...createAccountsSlice(set),
        ...createTransactionsSlice(set),
        ...createBudgetSlice(set),
        ...createSessionSlice(set),
        ...createCategoriesSlice(set),
        ...createAnalyticsSlice(set, get),
      }),
      {
        name: 'money-mapper-store', // localStorage key
        partialize: (state: AppStore) => ({
          // Only persist these fields
          accounts: state.accounts,
          transactions: state.transactions,
          budget: state.budget,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          categories: state.categories,
          // Don't persist loading/error states
        }),
      }
    ),
    {
      name: 'MoneyMapper', // DevTools name
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

/**
 * Selector hooks for better performance
 * These prevent unnecessary re-renders by selecting specific slices
 */
export const useAccounts = () => useAppStore((state: AppStore) => ({
  accounts: state.accounts,
  isLoading: state.accountsLoading,
  error: state.accountsError,
  setAccounts: state.setAccounts,
  clearAccounts: state.clearAccounts,
}))

export const useTransactions = () => useAppStore((state: AppStore) => ({
  transactions: state.transactions,
  isLoading: state.transactionsLoading,
  error: state.transactionsError,
  setTransactions: state.setTransactions,
  clearTransactions: state.clearTransactions,
}))

export const useBudget = () => useAppStore((state: AppStore) => ({
  budget: state.budget,
  isLoading: state.isLoading,
  error: state.error,
  setBudget: state.setBudget,
  clearBudget: state.clearBudget,
}))

export const useSession = () => useAppStore((state: AppStore) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
  setUser: state.setUser,
  clearSession: state.clearSession,
}))

export const useCategories = () => useAppStore((state: AppStore) => ({
  categories: state.categories,
  isLoading: state.isLoading,
  error: state.error,
  setCategories: state.setCategories,
  clearCategories: state.clearCategories,
}))

export const useAnalytics = () => useAppStore((state: AppStore) => ({
  data: state.data,
  isLoading: state.isLoading,
  error: state.error,
  setAnalyticsData: state.setAnalyticsData,
  clearAnalytics: state.clearAnalytics,
}))

/**
 * Clear all store data (useful for logout)
 */
export const useClearStore = () => useAppStore((state: AppStore) => ({
  clearAll: () => {
    state.clearAccounts()
    state.clearTransactions()
    state.clearBudget()
    state.clearSession()
    state.clearCategories()
    state.clearAnalytics()
  }
}))
