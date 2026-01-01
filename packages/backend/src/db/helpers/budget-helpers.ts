import { connectDB } from '../mongo'
import type { Budget, CategoryBudget, BudgetPeriod } from '@money-mapper/shared'
import { ObjectId } from 'mongodb'

export async function getBudgets(customerId: string): Promise<Budget[]> {
  const db = await connectDB()
  const docs = await db.collection('budgets')
    .find({ customerId })
    .sort({ isActive: -1, createdAt: -1 })
    .toArray();

  return docs.map(doc => {
    const { _id, customerId, name, isActive, totalBudgetLimit, categories, period, createdAt, updatedAt } = doc;
    return {
      id: _id.toString(),
      customerId,
      name,
      isActive,
      totalBudgetLimit,
      categories,
      period,
      createdAt,
      updatedAt
    } as Budget;
  });
}

export async function getBudgetById(customerId: string, budgetId: string): Promise<Budget | null> {
  const db = await connectDB()
  return db.collection('budgets').findOne({ 
    _id: new ObjectId(budgetId),
    customerId 
  }) as Promise<Budget | null>
}

export async function getActiveBudget(customerId: string): Promise<Budget | null> {
  const db = await connectDB()
  return db.collection('budgets').findOne({ 
    customerId,
    isActive: true 
  }) as Promise<Budget | null>
}

export async function getBudget(customerId: string): Promise<Budget | null> {
  return getActiveBudget(customerId)
}

export async function createBudget(
  customerId: string,
  name: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod,
  setAsActive: boolean = false
): Promise<string> {
  const db = await connectDB()
  
  const budgetCount = await db.collection('budgets').countDocuments({ customerId })
  if (budgetCount >= 10) {
    throw new Error('Maximum of 10 budgets allowed per user')
  }
  
  if (setAsActive) {
    await db.collection('budgets').updateMany(
      { customerId },
      { $set: { isActive: false, updatedAt: new Date() } }
    )
  }
  
  const result = await db.collection('budgets').insertOne({
    customerId,
    name,
    isActive: setAsActive,
    totalBudgetLimit,
    categories,
    period: period || { type: 'current-month' },
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  return result.insertedId.toString()
}

export async function updateBudgetById(
  customerId: string,
  budgetId: string,
  updates: {
    name?: string
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
): Promise<void> {
  const db = await connectDB()
  
  const updateFields: any = {
    updatedAt: new Date()
  }
  
  if (updates.name !== undefined) updateFields.name = updates.name
  if (updates.totalBudgetLimit !== undefined) updateFields.totalBudgetLimit = updates.totalBudgetLimit
  if (updates.categories !== undefined) updateFields.categories = updates.categories
  if (updates.period !== undefined) updateFields.period = updates.period
  
  await db.collection('budgets').updateOne(
    { _id: new ObjectId(budgetId), customerId },
    { $set: updateFields }
  )
}

export async function setActiveBudget(customerId: string, budgetId: string): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budgets').updateMany(
    { customerId },
    { $set: { isActive: false, updatedAt: new Date() } }
  )
  
  await db.collection('budgets').updateOne(
    { _id: new ObjectId(budgetId), customerId },
    { $set: { isActive: true, updatedAt: new Date() } }
  )
}

export async function deleteBudget(customerId: string, budgetId: string): Promise<void> {
  const db = await connectDB()
  
  const budget = await getBudgetById(customerId, budgetId)
  if (!budget) {
    throw new Error('Budget not found')
  }
  
  if (budget.isActive) {
    const otherBudgets = await db.collection('budgets')
      .find({ customerId, _id: { $ne: new ObjectId(budgetId) } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()
    
    if (otherBudgets.length > 0) {
      await db.collection('budgets').updateOne(
        { _id: otherBudgets[0]._id },
        { $set: { isActive: true, updatedAt: new Date() } }
      )
    }
  }
  
  await db.collection('budgets').deleteOne({ 
    _id: new ObjectId(budgetId),
    customerId 
  })
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
    { customerId, isActive: true },
    {
      $set: updateFields,
      $setOnInsert: {
        customerId,
        name: 'My Budget',
        isActive: true,
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
