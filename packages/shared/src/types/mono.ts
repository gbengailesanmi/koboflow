import { MonoTransaction } from './transaction'

export interface MonoAuthResponse {
  status: string
  message: string
  timestamp: string
  data: {
    id: string
  }
}

export interface MonoAccountDetails {
  account: {
    id: string
    name: string
    account_number: string
    currency: string
    balance: number
    bvn: string | null
    type: string
    institution: {
      name: string
      bank_code: string
      type: string
    }
  }
  customer: {
    id: string
  }
  meta: {
    data_status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'FAILED' | 'PROCESSING'
    auth_method: string
    data_request_id?: string
    session_id?: string
    retrieved_data?: string[]
  }
}

export interface MonoAccountIdentity {
  full_name: string
  email: string
  phone: string
  gender: string
  dob: string
  bvn: string
  marital_status: string
  address_line1: string
  address_line2: string
}

export interface MonoAccountBalance {
  ledger_balance: number
  available_balance: number
  currency: string
}

export interface MonoCreditWorthinessRequest {
  bvn: string
  principal: number
  interest_rate: number
  term: number
  run_credit_check: boolean
  existing_loans?: Array<{
    tenor: number
    date_opened: string
    closed_date: string
    institution: string
    currency: string
    repayment_amount: number
    opening_balance: number
    loan_status: string
    repayment_schedule: Array<Record<string, string>>
  }>
}

export interface MonoStatementOptions {
  period: 'last1month' | 'last2months' | 'last3months' | 'last6months' | 'last12months'
  output?: 'json' | 'pdf'
}

export interface MonoEarnings {
  total_earnings: number
  currency: string
  earnings: Array<{
    date: string
    amount: number
    type: string
  }>
}

export interface MonoAssets {
  total_value: number
  currency: string
  assets: Array<{
    name: string
    type: string
    value: number
    units: number
  }>
}