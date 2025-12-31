'use server'

import { revalidateTag } from 'next/cache'
import { deleteAccount } from '../../lib/server/api-service'

/**
 * Server Action: Delete user account and all associated data
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function deleteAccountAction(): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await deleteAccount()

    if (result.success) {
      revalidateTag('session', 'default')
      revalidateTag('accounts', 'default')
      revalidateTag('transactions', 'default')
      revalidateTag('budget', 'default')
      revalidateTag('budgets', 'default')
      revalidateTag('settings', 'default')
      revalidateTag('categories', 'default')
      revalidateTag('sessions-list', 'default')
    }

    return result
    
  } catch (error: any) {
    console.error('deleteAccountAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete account',
    }
  }
}
