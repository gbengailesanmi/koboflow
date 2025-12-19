/**
 * Mono Connect Service
 * A suite of APIs to retrieve users' financial data from Nigerian banks
 * 
 * API Documentation: https://docs.mono.co
 * Base URL: https://api.withmono.com/v2
 */

import config from '../config'

const MONO_API_BASE = 'https://api.withmono.com/v2'


export interface MonoCustomer {
  name: string
  email: string
}

export interface MonoMeta {
  ref?: string
}

export interface MonoInitiateRequest {
  customer: {
    name?: string
    email?: string
    id?: string // When supplying this, name and email are optional
  }
  meta?: {
    ref?: string // Unique reference (Minimum of 10 characters)
  }
  scope: 'auth' | 'reauth'
  institution?: {
    id?: string
    auth_method?: 'mobile_banking' | 'internet_banking'
  }
  redirect_url: string
  account?: string // Required for reauth
}

export interface MonoInitiateResponse {
  status: string
  message: string
  timestamp: string
  data: {
    mono_url: string
    customer: string
    meta?: {
      ref?: string
    }
    scope: string
    institution: Record<string, any>
    redirect_url: string
    is_multi: boolean
    created_at: string
  }
}

export interface MonoAuthResponse {
  status: string
  message: string
  timestamp: string
  data: {
    id: string // Account ID
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


/**
 * POST /v2/accounts/auth
 * Exchange code from Mono Connect widget for account ID
 * The code comes from the redirect_url after user authenticates
 * Example: https://yourdomain.com/callback?code=code_xyz123
 */
export async function exchangeToken(code: string): Promise<string> {
  const response = await monoFetch<MonoAuthResponse>('/accounts/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return response.data.id
}


/**
 * GET /v2/accounts/{id}
 * Fetch account details with exact Mono API response format
 * Returns full response with status, message, timestamp, and data
 */
export async function fetchAccountDetails(accountId: string, realtime: boolean = false): Promise<{
  status: string
  message: string
  timestamp: string
  data: MonoAccountDetails
}> {
  const headers: Record<string, string> = {}
  if (realtime) {
    headers['x-realtime'] = 'true'
  }
  
  return monoFetch<{
    status: string
    message: string
    timestamp: string
    data: MonoAccountDetails
  }>(`/accounts/${accountId}`, { headers })
}

/**
 * GET /v2/accounts/{id}/identity
 * Fetch account identity information
 */
export async function fetchAccountIdentity(accountId: string): Promise<MonoAccountIdentity> {
  const response = await monoFetch<{ data: MonoAccountIdentity }>(`/accounts/${accountId}/identity`)
  return response.data
}

/**
 * GET /v2/accounts/{id}/balance
 * Fetch account balance (with optional real-time flag)
 */
export async function fetchAccountBalance(accountId: string, realtime: boolean = false): Promise<MonoAccountBalance> {
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
 * Fetch creditworthiness of a user's account
 */
export async function fetchCreditWorthiness(
  accountId: string,
  data: MonoCreditWorthinessRequest
): Promise<any> {
  const response = await monoFetch<{ data: any }>(`/accounts/${accountId}/creditworthiness`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.data
}


/**
 * GET /v2/accounts/{id}/transactions
 * Fetch transactions for an account
 */
export async function fetchTransactions(
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
export async function fetchAllTransactions(
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
  
  const requestOptions: any = {
    paginate: true,
    page,
  }
  
  if (options.start) {
    requestOptions.start = formatDate(options.start)
    console.log(`[Mono] Using start date: ${requestOptions.start}`)
  } else {
    console.log(`[Mono] No start date filter - fetching all available transactions`)
  }
  
  if (options.end) {
    requestOptions.end = formatDate(options.end)
    console.log(`[Mono] Using end date: ${requestOptions.end}`)
  }
  
  if (options.narration) {
    requestOptions.narration = options.narration
  }
  
  if (options.type) {
    requestOptions.type = options.type
  }
  
  while (hasMore) {
    console.log(`[Mono] Fetching transactions page ${page}`)
    requestOptions.page = page
    
    const response = await fetchTransactions(accountId, requestOptions)
    
    const transactions = response.data || []
    console.log(`[Mono] Got ${transactions.length} transactions on page ${page}`)
    
    allTransactions.push(...transactions)
    
    hasMore = response.meta?.next !== null && transactions.length > 0
    page++
    
    if (page > 100) {
      console.warn('[Mono] Reached page limit (100), stopping pagination')
      break
    }
  }
  
  console.log(`[Mono] Total transactions fetched: ${allTransactions.length}`)
  return allTransactions
}


/**
 * GET /v2/accounts/{id}/statement
 * Fetch account statement (1-12 months)
 */
export async function fetchAccountStatement(
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
 * Fetch statement job status
 */
export async function fetchStatementJobStatus(accountId: string, jobId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/accounts/${accountId}/statement/jobs/${jobId}`
  )
  return response.data
}


/**
 * GET /v2/accounts/{id}/earnings
 * Fetch earnings from investment accounts
 */
export async function fetchAccountEarnings(accountId: string): Promise<MonoEarnings> {
  const response = await monoFetch<{ data: MonoEarnings }>(`/accounts/${accountId}/earnings`)
  return response.data
}

/**
 * GET /v2/accounts/{id}/assets
 * Fetch assets from investment accounts
 */
export async function fetchAccountAssets(accountId: string): Promise<MonoAssets> {
  const response = await monoFetch<{ data: MonoAssets }>(`/accounts/${accountId}/assets`)
  return response.data
}


/**
 * GET /v2/enrichments/{id}/transaction-categorisation
 * Fetch transaction categories (call when categories are null)
 */
export async function fetchTransactionCategorisation(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/transaction-categorisation`
  )
  return response.data
}

/**
 * GET /v2/enrichments/{id}/statement-insights
 * Fetch statement insights/analytics
 */
export async function fetchStatementInsights(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/statement-insights`
  )
  return response.data
}


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


/**
 * Format Mono account for storage in our database
 * Preserves exact Mono API format and adds customer context
 */
export function formatAccountForStorage(
  response: MonoAccountDetails,
  appCustomerId: string
): any {
  const { account, customer, meta } = response
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    type: account.type,
    account_number: account.account_number,
    balance: account.balance,
    bvn: account.bvn,
    institution: {
      name: account.institution.name,
      bank_code: account.institution.bank_code,
      type: account.institution.type,
    },
    
    customerId: appCustomerId,
    monoCustomerId: customer.id,
    
    meta: {
      data_status: meta.data_status,
      auth_method: meta.auth_method,
      data_request_id: meta.data_request_id,
      session_id: meta.session_id,
      retrieved_data: meta.retrieved_data,
    },
    lastRefreshed: new Date(),
    provider: 'mono',
  }
}
