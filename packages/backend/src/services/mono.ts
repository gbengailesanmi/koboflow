/**
 * Mono Connect Service
 * A suite of APIs to retrieve users' financial data from Nigerian banks
 * 
 * API Documentation: https://docs.mono.co
 * Base URL: https://api.withmono.com/v2
 */

import config from '../config'
import { hasher } from '../db/helpers/hasher'

const MONO_API_BASE = 'https://api.withmono.com/v2'

// ============================================================================
// Types
// ============================================================================

export interface MonoCustomer {
  name: string
  email: string
}

export interface MonoMeta {
  ref?: string
}

export interface MonoInitiateRequest {
  customer: MonoCustomer
  meta?: MonoMeta
  scope: 'auth' | 'reauth'
  redirect_url: string
  account?: string // Required for reauth
}

export interface MonoInitiateResponse {
  mono_url: string
  customer: string
  reference: string
}

export interface MonoAuthResponse {
  id: string // Account ID
}

export interface MonoAccountDetails {
  id: string
  name: string
  account_number: string
  currency: string
  balance: number
  auth_method: string
  status: string
  bvn: string
  type: string
  institution: {
    id: string
    name: string
    bank_code: string
    type: string
  }
  customer: {
    id: string
    name: string
    email: string
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

export interface MonoTransaction {
  id: string
  narration: string
  amount: number
  type: 'debit' | 'credit'
  category: string | null
  currency: string
  balance: number
  date: string
}

export interface MonoTransactionsResponse {
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make authenticated request to Mono API
 */
async function monoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${MONO_API_BASE}${endpoint}`
  
  console.log(`[Mono] ${options.method || 'GET'} ${url}`)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'mono-sec-key': config.MONO_SECRET_KEY!,
      ...options.headers,
    },
  })

  const text = await response.text()
  
  if (!text || text.trim() === '') {
    throw new Error(`Empty response from Mono API: ${endpoint}`)
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch (e) {
    console.error(`[Mono] Invalid JSON response:`, text.substring(0, 200))
    throw new Error(`Invalid JSON from Mono API: ${endpoint}`)
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`
    console.error(`[Mono] API Error:`, errorMessage)
    throw new Error(errorMessage)
  }

  console.log(`[Mono] Response:`, JSON.stringify(data).substring(0, 200))
  return data
}

/**
 * Format date as dd-mm-yyyy (Mono's required format)
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// ============================================================================
// Authorisation Endpoints
// ============================================================================

/**
 * POST /v2/accounts/initiate
 * Initiates linking a user's account
 */
export async function initiateAccountLinking(
  customer: MonoCustomer,
  redirectUrl: string,
  meta?: MonoMeta
): Promise<MonoInitiateResponse> {
  const response = await monoFetch<{ data: MonoInitiateResponse }>('/accounts/initiate', {
    method: 'POST',
    body: JSON.stringify({
      customer,
      meta,
      scope: 'auth',
      redirect_url: redirectUrl,
    }),
  })
  return response.data
}

/**
 * POST /v2/accounts/initiate (reauth)
 * Initiates account reauthorization
 */
export async function initiateAccountReauth(
  accountId: string,
  redirectUrl: string,
  meta?: MonoMeta
): Promise<MonoInitiateResponse> {
  const response = await monoFetch<{ data: MonoInitiateResponse }>('/accounts/initiate', {
    method: 'POST',
    body: JSON.stringify({
      meta,
      scope: 'reauth',
      account: accountId,
      redirect_url: redirectUrl,
    }),
  })
  return response.data
}

/**
 * POST /v2/accounts/auth
 * Exchange code from Mono Connect widget for account ID
 */
export async function exchangeToken(code: string): Promise<string> {
  const response = await monoFetch<{ data: MonoAuthResponse }>('/accounts/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return response.data.id
}

// ============================================================================
// Account Endpoints
// ============================================================================

/**
 * GET /v2/accounts/{id}
 * Get account details
 */
export async function getAccountDetails(accountId: string): Promise<MonoAccountDetails> {
  const response = await monoFetch<{ data: MonoAccountDetails }>(`/accounts/${accountId}`)
  return response.data
}

/**
 * GET /v2/accounts/{id}/identity
 * Get account identity information
 */
export async function getAccountIdentity(accountId: string): Promise<MonoAccountIdentity> {
  const response = await monoFetch<{ data: MonoAccountIdentity }>(`/accounts/${accountId}/identity`)
  return response.data
}

/**
 * GET /v2/accounts/{id}/balance
 * Get account balance (with optional real-time flag)
 */
export async function getAccountBalance(accountId: string, realtime: boolean = false): Promise<MonoAccountBalance> {
  const headers: Record<string, string> = {}
  if (realtime) {
    headers['x-realtime'] = 'true'
  }
  
  const response = await monoFetch<{ data: MonoAccountBalance }>(
    `/accounts/${accountId}/balance`,
    { headers }
  )
  return response.data
}

/**
 * POST /v2/accounts/{id}/unlink
 * Unlink a financial account
 */
export async function unlinkAccount(accountId: string): Promise<void> {
  await monoFetch(`/accounts/${accountId}/unlink`, {
    method: 'POST',
  })
}

/**
 * POST /v2/accounts/{id}/creditworthiness
 * Get creditworthiness of a user's account
 */
export async function getCreditWorthiness(
  accountId: string,
  data: MonoCreditWorthinessRequest
): Promise<any> {
  const response = await monoFetch<{ data: any }>(`/accounts/${accountId}/creditworthiness`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.data
}

// ============================================================================
// Transaction Endpoints
// ============================================================================

/**
 * GET /v2/accounts/{id}/transactions
 * Get transactions for an account
 */
export async function getTransactions(
  accountId: string,
  options: {
    start?: string  // dd-mm-yyyy
    end?: string    // dd-mm-yyyy
    narration?: string
    type?: 'debit' | 'credit'
    paginate?: boolean
    page?: number
  } = {}
): Promise<MonoTransactionsResponse> {
  const params = new URLSearchParams()
  
  if (options.start) params.append('start', options.start)
  if (options.end) params.append('end', options.end)
  if (options.narration) params.append('narration', options.narration)
  if (options.type) params.append('type', options.type)
  if (options.paginate !== undefined) params.append('paginate', String(options.paginate))
  if (options.page) params.append('page', String(options.page))
  
  const queryString = params.toString()
  const endpoint = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`
  
  return monoFetch<MonoTransactionsResponse>(endpoint)
}

/**
 * Fetch all transactions (handles pagination)
 */
export async function getAllTransactions(
  accountId: string,
  options: {
    start?: Date
    end?: Date
    narration?: string
    type?: 'debit' | 'credit'
  } = {}
): Promise<MonoTransaction[]> {
  const allTransactions: MonoTransaction[] = []
  let page = 1
  let hasMore = true
  
  const startDate = options.start ? formatDate(options.start) : undefined
  const endDate = options.end ? formatDate(options.end) : formatDate(new Date())
  
  while (hasMore) {
    console.log(`[Mono] Fetching transactions page ${page}`)
    
    const response = await getTransactions(accountId, {
      start: startDate,
      end: endDate,
      narration: options.narration,
      type: options.type,
      paginate: true,
      page,
    })
    
    const transactions = response.data || []
    console.log(`[Mono] Got ${transactions.length} transactions on page ${page}`)
    
    allTransactions.push(...transactions)
    
    hasMore = response.meta?.next !== null && transactions.length > 0
    page++
    
    // Safety limit
    if (page > 100) {
      console.warn('[Mono] Reached page limit (100), stopping pagination')
      break
    }
  }
  
  console.log(`[Mono] Total transactions fetched: ${allTransactions.length}`)
  return allTransactions
}

// ============================================================================
// Statement Endpoints
// ============================================================================

/**
 * GET /v2/accounts/{id}/statement
 * Get account statement (1-12 months)
 */
export async function getAccountStatement(
  accountId: string,
  options: MonoStatementOptions
): Promise<any> {
  const params = new URLSearchParams()
  params.append('period', options.period)
  if (options.output) params.append('output', options.output)
  
  const response = await monoFetch<{ data: any }>(
    `/accounts/${accountId}/statement?${params.toString()}`
  )
  return response.data
}

/**
 * GET /v2/accounts/{id}/statement/jobs/{jobId}
 * Get statement job status
 */
export async function getStatementJobStatus(accountId: string, jobId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/accounts/${accountId}/statement/jobs/${jobId}`
  )
  return response.data
}

// ============================================================================
// Investment Endpoints
// ============================================================================

/**
 * GET /v2/accounts/{id}/earnings
 * Get earnings from investment accounts
 */
export async function getAccountEarnings(accountId: string): Promise<MonoEarnings> {
  const response = await monoFetch<{ data: MonoEarnings }>(`/accounts/${accountId}/earnings`)
  return response.data
}

/**
 * GET /v2/accounts/{id}/assets
 * Get assets from investment accounts
 */
export async function getAccountAssets(accountId: string): Promise<MonoAssets> {
  const response = await monoFetch<{ data: MonoAssets }>(`/accounts/${accountId}/assets`)
  return response.data
}

// ============================================================================
// Data Enrichment Endpoints
// ============================================================================

/**
 * GET /v2/enrichments/{id}/transaction-categorisation
 * Get transaction categories (call when categories are null)
 */
export async function getTransactionCategorisation(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/transaction-categorisation`
  )
  return response.data
}

/**
 * GET /v2/enrichments/{id}/statement-insights
 * Get statement insights/analytics
 */
export async function getStatementInsights(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/statement-insights`
  )
  return response.data
}

// ============================================================================
// Account Sync
// ============================================================================

/**
 * POST /v2/accounts/{id}/sync
 * Trigger manual data sync for an account
 */
export async function syncAccount(accountId: string): Promise<{ status: string }> {
  const response = await monoFetch<{ data: { status: string } }>(
    `/accounts/${accountId}/sync`,
    { method: 'POST' }
  )
  return response.data
}

// ============================================================================
// Helper: List All Accounts
// ============================================================================

/**
 * GET /v2/accounts
 * List all linked accounts (useful to find account IDs)
 */
export async function listAllAccounts(): Promise<MonoAccountDetails[]> {
  const response = await monoFetch<{ data: MonoAccountDetails[], meta: any }>('/accounts')
  return response.data
}

/**
 * Get accounts for a specific customer ID
 */
export async function getAccountsByCustomerId(customerId: string): Promise<MonoAccountDetails[]> {
  const allAccounts = await listAllAccounts()
  return allAccounts.filter(acc => acc.customer?.id === customerId)
}

// ============================================================================
// Data Formatting Helpers
// ============================================================================

/**
 * Format Mono account for storage in our database
 */
export function formatAccountForStorage(
  account: MonoAccountDetails,
  appCustomerId: string
): any {
  return {
    id: account.id,
    customerId: appCustomerId,
    uniqueId: hasher(`${account.account_number}${account.institution.bank_code}`),
    name: account.name,
    type: account.type,
    accountNumber: account.account_number,
    balance: (account.balance / 100).toFixed(2), // Convert kobo to naira
    balanceRaw: account.balance,
    currency: account.currency,
    institution: {
      name: account.institution.name,
      bankCode: account.institution.bank_code,
      type: account.institution.type,
    },
    bvn: account.bvn,
    status: account.status,
    authMethod: account.auth_method,
    monoCustomerId: account.customer?.id,
    monoCustomerEmail: account.customer?.email,
    lastRefreshed: new Date(),
    provider: 'mono',
  }
}

/**
 * Format Mono transactions for storage in our database
 */
export function formatTransactionsForStorage(
  transactions: MonoTransaction[],
  accountId: string,
  accountUniqueId: string,
  appCustomerId: string
): any[] {
  return transactions.map(txn => ({
    id: txn.id,
    transactionUniqueId: hasher(`${txn.id}${accountId}${txn.date}`),
    accountUniqueId,
    accountId,
    customerId: appCustomerId,
    amount: (txn.amount / 100).toFixed(2), // Convert kobo to naira
    amountRaw: txn.amount,
    type: txn.type,
    narration: txn.narration?.toLowerCase().trim() || '',
    currencyCode: txn.currency,
    category: txn.category,
    balance: txn.balance,
    bookedDate: new Date(txn.date),
    provider: 'mono',
  }))
}
