import { connectDB } from '../mongo'
import type { Budget, CategoryBudget, BudgetPeriod } from '@money-mapper/shared'

/**
 * Get or create budget for a customer
 */
export async function getBudget(customerId: string): Promise<Budget | null> {
  const db = await connectDB()
  return db.collection('budgets').findOne({ customerId }) as Promise<Budget | null>
}

/**
 * Create or update budget for a customer
 */
export async function upsertBudget(
  customerId: string, 
  totalBudgetLimit: number, 
  categories: CategoryBudget[],
  period?: BudgetPeriod
): Promise<void> {
  const db = await connectDB()
  
  const updateFields: any = {
    totalBudgetLimit,
    categories,
    updatedAt: new Date()
  }
  
  // Include period if provided, otherwise keep existing or use default
  if (period) {
    updateFields.period = period
  }
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: updateFields,
      $setOnInsert: {
        customerId,
        createdAt: new Date()
      }
    },
    { upsert: true }
  )
}

/**
 * Update monthly budget
 */
export async function updateMonthlyBudget(
  customerId: string, 
  totalBudgetLimit: number,
  period?: BudgetPeriod
): Promise<void> {
  const db = await connectDB()
  
  const updateFields: any = {
    totalBudgetLimit,
    updatedAt: new Date()
  }
  
  // Include period if provided
  if (period) {
    updateFields.period = period
  }
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: updateFields
    }
  )
}

/**
 * Update category budgets
 */
export async function updateCategoryBudgets(
  customerId: string, 
  categories: CategoryBudget[]
): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: {
        categories,
        updatedAt: new Date()
      }
    }
  )
}

/**
 * Update budget period
 */
export async function updateBudgetPeriod(
  customerId: string,
  period: BudgetPeriod
): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: {
        period,
        updatedAt: new Date()
      }
    }
  )
}

/**
 * Update budget with period (convenience function)
 */
export async function updateBudgetWithPeriod(
  customerId: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod
): Promise<void> {
  const db = await connectDB()
  
  const updateFields: any = {
    totalBudgetLimit,
    categories,
    updatedAt: new Date()
  }
  
  if (period) {
    updateFields.period = period
  }
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: updateFields
    },
    { upsert: true }
  )
}
