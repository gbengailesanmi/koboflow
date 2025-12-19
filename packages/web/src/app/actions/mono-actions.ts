'use server'

import { revalidateTag } from 'next/cache'
import { 
  exchangeMonoToken, 
  importMonoAccount, 
  syncMonoTransactions 
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
