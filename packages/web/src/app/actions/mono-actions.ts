'use server'

import { revalidateTag } from 'next/cache'
import { logger } from '@money-mapper/shared/utils'
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
    const tokenResult = await exchangeMonoToken(code)
    
    if (!tokenResult.success || !tokenResult.accountId) {
      return { 
        success: false, 
        message: tokenResult.message || 'Failed to exchange token' 
      }
    }

    const accountId = tokenResult.accountId
    logger.info({ module: 'mono-action', accountId }, 'Token exchanged')

    const importResult = await importMonoAccount(accountId)
    
    if (!importResult.success) {
      return { 
        success: false, 
        message: importResult.message || 'Failed to import account' 
      }
    }

    logger.info({ module: 'mono-action', accountId }, 'Account imported')

    const transactionsResult = await syncMonoTransactions(accountId)
    
    if (!transactionsResult.success) {
      logger.warn({ module: 'mono-action', accountId, message: transactionsResult.message }, 'Transaction sync failed')
    } else {
      logger.info({ module: 'mono-action', accountId, transactionsCount: transactionsResult.transactionsCount }, 'Transactions synced')
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
    logger.error({ module: 'mono-action', error: error.message }, 'Mono connection failed')
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
    logger.error({ module: 'mono-action', accountId, error: error.message }, 'Fetch identity failed')
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
    logger.error({ module: 'mono-action', error: error.message }, 'Fetch customer details failed')
    return { 
      success: false, 
      message: error.message || 'Failed to fetch customer details' 
    }
  }
}
