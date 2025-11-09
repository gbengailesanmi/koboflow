import type { Budget } from '@/types/budget'

export interface BudgetSlice {
  budget: Budget | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setBudget: (budget: Budget | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearBudget: () => void
}

export const createBudgetSlice = (set: any): BudgetSlice => ({
  budget: null,
  isLoading: false,
  error: null,
  
  setBudget: (budget) => set({ budget, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearBudget: () => set({ budget: null, error: null, isLoading: false }),
})
