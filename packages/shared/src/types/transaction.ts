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
  accountId: string        // Mono's account ID (can change on re-link)
  customerId: string       // Your app's customer ID
  accountNumber?: string   // Stable: Bank account number
  bankCode?: string        // Stable: Bank code
  hash?: string            // SHA-256 hash for duplicate detection
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
