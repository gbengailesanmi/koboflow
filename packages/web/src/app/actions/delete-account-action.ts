'use server'

import { revalidateTag } from 'next/cache'
import { deleteAccount } from '../api/api-service'

/**
 * Server Action: Delete user account and all associated data
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function deleteAccountAction(): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await deleteAccount()

    if (result.success) {
      revalidateTag('session', 'fetch')
      revalidateTag('accounts', 'fetch')
      revalidateTag('transactions', 'fetch')
      revalidateTag('budget', 'fetch')
      revalidateTag('budgets', 'fetch')
      revalidateTag('settings', 'fetch')
      revalidateTag('categories', 'fetch')
      revalidateTag('sessions-list', 'fetch')
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
