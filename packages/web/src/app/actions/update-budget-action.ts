'use server'

import { revalidateTag } from 'next/cache'
import { 
  updateBudgetById as updateBudgetByIdService, 
  patchBudget as patchBudgetService
} from '../api/api-service'
import type { CategoryBudget, BudgetPeriod } from '@money-mapper/shared'

/**
 * Server Action to update a specific budget by ID
 * This runs on the server and can be called directly from client components
 */
export async function updateBudgetAction(
  budgetId: string,
  updates: {
    name?: string
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await updateBudgetByIdService(budgetId, updates)
    
    if (result.success) {
      // Revalidate budgets and budget tags
      revalidateTag('budgets')
      revalidateTag('budget')
      return { success: true }
    }
    
    return {
      success: false,
      message: result.message || 'Failed to update budget',
    }
  } catch (error: any) {
    console.error('[Budget Action] Update budget failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to update budget',
    }
  }
}
