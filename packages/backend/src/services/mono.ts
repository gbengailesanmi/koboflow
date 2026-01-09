import config from '../config'
import { normaliseTestAccountNumber, normaliseAccountBVNToIdentity } from '../test-helpers/account-normalizer'
import { logger } from '@koboflow/shared'
import { MonoTransaction, MonoAuthResponse, MonoAccountDetails, MonoAccountIdentity, MonoAccountBalance, MonoTransactionsResponse, MonoCreditWorthinessRequest, MonoStatementOptions, MonoEarnings, MonoAssets } from '@koboflow/shared'

const MONO_API_BASE = 'https://api.withmono.com/v2'

async function monoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${MONO_API_BASE}${endpoint}`
  
  logger.info({ module: 'mono-service', method: options.method || 'GET', url }, 'Mono API request')
  
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
    logger.error({ module: 'mono-service', endpoint, response: text.substring(0, 200) }, 'Invalid JSON response from Mono')
    throw new Error(`Invalid JSON from Mono API: ${endpoint}`)
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`
    logger.error({ module: 'mono-service', endpoint, errorMessage }, 'Mono API error')
    throw new Error(errorMessage)
  }

  logger.info({ module: 'mono-service', response: JSON.stringify(data).substring(0, 200) }, 'Mono API response')
  return data
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export async function exchangeToken(code: string): Promise<string> {
  const response = await monoFetch<MonoAuthResponse>('/accounts/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return response.data.id
}

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

export async function fetchAccountIdentity(accountId: string): Promise<MonoAccountIdentity> {
  const response = await monoFetch<{ data: MonoAccountIdentity }>(`/accounts/${accountId}/identity`)
  return response.data
}

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

export async function unlinkAccount(accountId: string): Promise<void> {
  await monoFetch(`/accounts/${accountId}/unlink`, {
    method: 'POST',
  })
}

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

export async function fetchTransactions(
  accountId: string,
  options: {
    start?: string
    end?: string
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

export async function fetchAllTransactions(
  accountId: string,
  options: {
    start?: Date
    end?: Date
    narration?: string
    type?: 'debit' | 'credit'
  } = {}
): Promise<MonoTransaction[]> {
  const ready = await waitForTransactionsReady(accountId)

  if (!ready) {
    return []
  }
  const allTransactions: MonoTransaction[] = []
  let page = 1
  let hasMore = true
  
  const requestOptions: any = {
    paginate: true,
    page,
  }
  
  if (options.start) {
    requestOptions.start = formatDate(options.start)
    logger.info({ module: 'mono-service', start: requestOptions.start }, 'Using start date for transactions')
  } else {
    logger.info({ module: 'mono-service' }, 'No start date filter - fetching all available transactions')
  }
  
  if (options.end) {
    requestOptions.end = formatDate(options.end)
    logger.info({ module: 'mono-service', end: requestOptions.end }, 'Using end date for transactions')
  }
  
  if (options.narration) {
    requestOptions.narration = options.narration
  }
  
  if (options.type) {
    requestOptions.type = options.type
  }
  
  while (hasMore) {
    logger.info({ module: 'mono-service', page }, 'Fetching transactions page')
    requestOptions.page = page
    
    const response = await fetchTransactions(accountId, requestOptions)
    
    const transactions = response.data || []
    logger.info({ module: 'mono-service', page, count: transactions.length }, 'Got transactions for page')
    
    allTransactions.push(...transactions)
    
    hasMore = response.meta?.next !== null && transactions.length > 0
    page++
    
    if (page > 100) {
      logger.warn({ module: 'mono-service' }, 'Reached page limit (100), stopping pagination')
      break
    }
  }
  
  logger.info({ module: 'mono-service', total: allTransactions.length }, 'Total transactions fetched')
  return allTransactions
}

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

export async function fetchStatementJobStatus(accountId: string, jobId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/accounts/${accountId}/statement/jobs/${jobId}`
  )
  return response.data
}

export async function fetchAccountEarnings(accountId: string): Promise<MonoEarnings> {
  const response = await monoFetch<{ data: MonoEarnings }>(`/accounts/${accountId}/earnings`)
  return response.data
}

export async function fetchAccountAssets(accountId: string): Promise<MonoAssets> {
  const response = await monoFetch<{ data: MonoAssets }>(`/accounts/${accountId}/assets`)
  return response.data
}

export async function fetchTransactionCategorisation(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/transaction-categorisation`
  )
  return response.data
}

export async function fetchStatementInsights(accountId: string): Promise<any> {
  const response = await monoFetch<{ data: any }>(
    `/enrichments/${accountId}/statement-insights`
  )
  return response.data
}

// export async function syncAccount(accountId: string): Promise<{ status: string }> {
//   const response = await monoFetch<{ data: { status: string } }>(
//     `/accounts/${accountId}/sync`,
//     { method: 'POST' }
//   )
//   return response.data
// }

export function formatAccountForStorage(
  response: MonoAccountDetails,
  appCustomerId: string,
  identityBVN?: string | null
): any {
  const { account, customer, meta } = response
  
  // -----------------------------------------------------------------
  //TEST NORMALISERS
  // Normalize account number for test environment (adds bank code suffix)
  const normalisedAccountNumber = normaliseTestAccountNumber(
    account.account_number,
    account.institution.bank_code
  )
  // Normalize account BVN to match identity BVN (last 4 digits)
  // In test: account BVN may differ from identity, so use identity's last 4
  // In production: account BVN already comes as last 4 digits from Mono
  const normalisedBVN = normaliseAccountBVNToIdentity(account.bvn)
  // -----------------------------------------------------------------

  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    type: account.type,
    account_number: normalisedAccountNumber,
    balance: account.balance,
    bvn: normalisedBVN,
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

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Waits until Mono reports that transactions are ready for an account
 * Polls account details and checks meta.retrieved_data
 */
export async function waitForTransactionsReady(
  accountId: string,
  options?: {
    intervalMs?: number
    maxAttempts?: number
  }
): Promise<boolean> {
  const intervalMs = options?.intervalMs ?? 10_000 // 10s
  const maxAttempts = options?.maxAttempts ?? 12   // ~2 minutes

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const details = await fetchAccountDetails(accountId)

    const retrieved = details.data.meta.retrieved_data ?? []
    const ready = retrieved.includes('transactions')

    if (ready) {
      logger.info({ module: 'mono-service', accountId }, 'Transactions are ready')
      return true
    }
    logger.info({ module: 'mono-service', accountId, attempt, maxAttempts }, 'Transactions not ready yet')
    await sleep(intervalMs)
  }
  logger.warn({ module: 'mono-service', accountId }, 'Timed out waiting for transactions to be ready')
  return false
}


// Re-export test helper for convenience
export { normaliseTestAccountNumber } from '../test-helpers/account-normalizer'

