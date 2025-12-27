'use server'

import { revalidateTag } from 'next/cache'
import { patchBudget } from '../../lib/server/api-service'
import { BudgetPeriod, CategoryBudget } from '@money-mapper/shared'

/**
 * Server Action: Partially update budget (PATCH)
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function patchBudgetAction(updates: {
  totalBudgetLimit?: number
  categories?: CategoryBudget[]
  period?: BudgetPeriod
}): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await patchBudget(updates)

    if (result.success) {
      revalidateTag('budget', 'fetch')
      revalidateTag('session', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('patchBudgetAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to patch budget',
    }
  }
}
