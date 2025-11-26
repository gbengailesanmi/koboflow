import { connectDB } from '../mongo'
import type { Budget, CategoryBudget, BudgetPeriod } from '@money-mapper/shared'

export async function getBudget(customerId: string): Promise<Budget | null> {
  const db = await connectDB()
  return db.collection('budgets').findOne({ customerId }) as Promise<Budget | null>
}

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
