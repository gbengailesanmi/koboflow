import type { Transaction } from '@/types/transactions'

export interface TransactionsSlice {
  transactions: Transaction[] | null
  transactionsLoading: boolean
  transactionsError: string | null
  setTransactions: (transactions: Transaction[]) => void
  setTransactionsLoading: (loading: boolean) => void
  setTransactionsError: (error: string | null) => void
  clearTransactions: () => void
}

export const createTransactionsSlice = (set: any): TransactionsSlice => ({
  transactions: null,
  transactionsLoading: false,
  transactionsError: null,
  setTransactions: (transactions: Transaction[]) => set({ transactions, transactionsError: null }),
  setTransactionsLoading: (loading: boolean) => set({ transactionsLoading: loading }),
  setTransactionsError: (error: string | null) => set({ transactionsError: error }),
  clearTransactions: () => set({ transactions: null, transactionsError: null })
})
