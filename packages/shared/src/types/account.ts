export type MonoAccount = {
  id: string
  name: string
  currency: string
  type: string
  account_number: string
  balance: number
  bvn: string | null
  institution: {
    name: string
    bank_code: string
    type: string
  }
}

export type MonoCustomer = {
  id: string
}

export type MonoMeta = {
  data_status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'FAILED' | 'PROCESSING'
  auth_method: string
  data_request_id?: string
  session_id?: string
  retrieved_data?: string[]
}

export type MonoAccountResponse = {
  status: string
  message: string
  timestamp: string
  data: {
    account: MonoAccount
    customer: MonoCustomer
    meta: MonoMeta
  }
}

// Enriched Account stored in DB
export type Account = MonoAccount & {
  customerId: string
  monoCustomerId?: string
  lastRefreshed: Date
  provider: 'mono'
  meta?: MonoMeta
}
