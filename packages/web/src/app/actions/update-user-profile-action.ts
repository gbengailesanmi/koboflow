'use server'

import { revalidateTag } from 'next/cache'
import { updateUserProfile } from '../api/api-service'

/**
 * Server Action: Update user profile
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function updateUserProfileAction(
  customerId: string,
  updates: {
    firstName?: string
    lastName?: string
    email?: string
    totalBudgetLimit?: number
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await updateUserProfile(customerId, updates)

    if (result.success) {
      revalidateTag('session', 'fetch')
      if (updates.totalBudgetLimit !== undefined) {
        revalidateTag('budget', 'fetch')
        revalidateTag('budgets', 'fetch')
      }
    }

    return result
  } catch (error: any) {
    console.error('updateUserProfileAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    }
  }
}
