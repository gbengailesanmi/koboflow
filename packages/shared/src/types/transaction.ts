export type MonoTransaction = {
  id: string
  narration: string
  amount: number
  type: 'debit' | 'credit'
  balance: number
  date: string
  category: string
}

export type Transaction = MonoTransaction & {
  accountId: string
  customerId: string
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
  data: Transaction[]
  meta: {
    total: number
    page: number
    previous: string | null
    next: string | null
  }
}
