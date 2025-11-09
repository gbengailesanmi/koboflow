import type { Account } from '@/types/account'

export interface AccountsSlice {
  accounts: Account[] | null
  accountsLoading: boolean
  accountsError: string | null
  setAccounts: (accounts: Account[]) => void
  setAccountsLoading: (loading: boolean) => void
  setAccountsError: (error: string | null) => void
  clearAccounts: () => void
}

export const createAccountsSlice = (set: any): AccountsSlice => ({
  accounts: null,
  accountsLoading: false,
  accountsError: null,
  setAccounts: (accounts: Account[]) => set({ accounts, accountsError: null }),
  setAccountsLoading: (loading: boolean) => set({ accountsLoading: loading }),
  setAccountsError: (error: string | null) => set({ accountsError: error }),
  clearAccounts: () => set({ accounts: null, accountsError: null })
})
