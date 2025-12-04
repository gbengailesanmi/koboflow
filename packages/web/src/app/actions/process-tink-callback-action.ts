'use server'

import { revalidateTag } from 'next/cache'
import { processTinkCallback } from '../api/api-service'

/**
 * Server Action: Process Tink OAuth callback to import accounts and transactions
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function processTinkCallbackAction(code: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
}> {
  try {
    const result = await processTinkCallback(code)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('processTinkCallbackAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to process bank data',
    }
  }
}
