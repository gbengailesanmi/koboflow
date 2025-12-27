'use server'

import { revalidateTag } from 'next/cache'
import { setActiveBudget as setActiveBudgetService } from '../../lib/server/api-service'

/**
 * Server Action to set a budget as active
 * This runs on the server and can be called directly from client components
 */
export async function setActiveBudgetAction(budgetId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const result = await setActiveBudgetService(budgetId)
    
    if (result.success) {
      revalidateTag('budgets', 'fetch')
      revalidateTag('budget', 'fetch')
      return { success: true }
    }
    
    return {
      success: false,
      message: result.message || 'Failed to set active budget',
    }
  } catch (error: any) {
    console.error('[Budget Action] Set active budget failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to set active budget',
    }
  }
}
