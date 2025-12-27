'use server'

import { revalidateTag } from 'next/cache'
import { deleteBudgetById as deleteBudgetByIdService } from '../../lib/server/api-service'

/**
 * Server Action: Delete a budget by ID
 * Handles cache revalidation for budgets list and active budget
 */
export async function deleteBudgetByIdAction(budgetId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await deleteBudgetByIdService(budgetId)

    if (result.success) {
      revalidateTag('budgets', 'fetch')
      revalidateTag('budget', 'fetch')
      return { success: true }
    }

    return {
      success: false,
      message: result.message || 'Failed to delete budget',
    }
  } catch (error: any) {
    console.error('deleteBudgetByIdAction error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete budget',
    }
  }
}
