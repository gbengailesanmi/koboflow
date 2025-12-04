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
      // Revalidate everything since user is deleted
      revalidateTag('session')
      revalidateTag('accounts')
      revalidateTag('transactions')
      revalidateTag('budget')
      revalidateTag('budgets')
      revalidateTag('settings')
      revalidateTag('categories')
      revalidateTag('sessions-list')
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
