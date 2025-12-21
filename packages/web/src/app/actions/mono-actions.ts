'use server'

import { revalidateTag } from 'next/cache'
import { 
  exchangeMonoToken, 
  importMonoAccount, 
  syncMonoTransactions,
  getMonoAccountIdentity,
  getCustomerDetailsFromMono
} from '@/app/api/api-service'

export async function processMonoConnection(code: string): Promise<{
  success: boolean
  message?: string
  accountId?: string
  transactionsCount?: number
}> {
  try {
    console.log('[Mono Server Action] Exchanging token...')
    const tokenResult = await exchangeMonoToken(code)
    
    if (!tokenResult.success || !tokenResult.accountId) {
      return { 
        success: false, 
        message: tokenResult.message || 'Failed to exchange token' 
      }
    }

    const accountId = tokenResult.accountId
    console.log('[Mono Server Action] Got accountId:', accountId)

    console.log('[Mono Server Action] Importing account...')
    const importResult = await importMonoAccount(accountId)
    
    if (!importResult.success) {
      return { 
        success: false, 
        message: importResult.message || 'Failed to import account' 
      }
    }

    console.log('[Mono Server Action] Account imported successfully!')

    console.log('[Mono Server Action] Syncing transactions...')
    const transactionsResult = await syncMonoTransactions(accountId)
    
    if (!transactionsResult.success) {
      console.warn('[Mono Server Action] Transaction sync failed:', transactionsResult.message)
    } else {
      console.log(`[Mono Server Action] Successfully synced ${transactionsResult.transactionsCount || 0} transactions`)
    }

    revalidateTag('accounts')
    revalidateTag('transactions')
    revalidateTag('customer-details')
    
    return {
      success: true,
      accountId,
      transactionsCount: transactionsResult.transactionsCount || 0,
      message: 'Account linked successfully'
    }
  } catch (error: any) {
    console.error('[Mono Server Action] Error:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to process Mono connection' 
    }
  }
}

export async function fetchAccountIdentity(accountId: string): Promise<{
  success: boolean
  message?: string
  data?: {
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
}> {
  try {
    return await getMonoAccountIdentity(accountId)
  } catch (error: any) {
    console.error('[Mono Server Action] Fetch identity error:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to fetch account identity' 
    }
  }
}

export async function fetchCustomerDetails(): Promise<{
  success: boolean
  message?: string
  customerDetailsFromMono?: {
    full_name: string
    bvn: string
    phone: string
    gender: string
    dob: string
    address_line1: string
    address_line2?: string
    marital_status: string
    created_at: string
    updated_at: string
  } | null
  customerDetailsLastUpdated?: Date | null
}> {
  try {
    return await getCustomerDetailsFromMono()
  } catch (error: any) {
    console.error('[Mono Server Action] Fetch customer details error:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to fetch customer details' 
    }
  }
}
