// packages/shared/src/types/transaction.ts

export type MonoTransaction = {
  id: string
  narration: string
  amount: number
  type: 'debit' | 'credit'
  balance: number
  date: string
  category: string | null
}

export type EnrichedTransaction = {
  id: string
  narration: string
  amount: number
  type: 'debit' | 'credit'
  balance: number
  date: string
  category: string

  accountId: string
  customerId: string
  accountNumber?: string
  bankCode?: string
  hash?: string
}

export type MonoTransactionsResponse = {
  status: string
  message: string
  timestamp: string
  data: MonoTransaction[]
  meta: {
    total: number
    page: number
    previous: string | null
    next: string | null
  }
}

export type TransactionsResponse = {
  status: string
  message: string
  timestamp: string
  data: EnrichedTransaction[]
  meta: {
    total: number
    page: number
    previous: string | null
    next: string | null
  }
}
