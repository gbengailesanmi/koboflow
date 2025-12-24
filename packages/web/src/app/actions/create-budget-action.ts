'use server'

import { revalidateTag } from 'next/cache'
import { createNewBudget as createNewBudgetService } from '../api/api-service'
import type { CategoryBudget, BudgetPeriod } from '@money-mapper/shared'

/**
 * Server Action to create a new budget
 * This runs on the server and can be called directly from client components
 */
export async function createBudgetAction(
  name: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod,
  setAsActive?: boolean
): Promise<{ success: boolean; message?: string; budgetId?: string }> {
  try {
    const result = await createNewBudgetService(
      name,
      totalBudgetLimit,
      categories,
      period,
      setAsActive
    )
    
    if (result.success) {
      revalidateTag('budgets', 'fetch')
      revalidateTag('budget', 'fetch')
      return {
        success: true,
        budgetId: result.budgetId,
      }
    }
    
    return {
      success: false,
      message: result.message || 'Failed to create budget',
    }
  } catch (error: any) {
    console.error('[Budget Action] Create budget failed:', error)
    return {
      success: false,
      message: error.message || 'Failed to create budget',
    }
  }
}
