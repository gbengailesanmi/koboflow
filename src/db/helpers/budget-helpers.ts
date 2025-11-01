
import { connectDB } from '@/db/mongo'
import type { Budget, BudgetSpending, CategoryBudget } from '@/types/budget'

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
  monthly: number, 
  categories: CategoryBudget[]
): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: {
        monthly,
        categories,
        updatedAt: new Date()
      },
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
  monthly: number
): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budgets').updateOne(
    { customerId },
    {
      $set: {
        monthly,
        updatedAt: new Date()
      }
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
 * Get current month spending summary
 */
export async function getMonthlySpending(
  customerId: string, 
  month: string // Format: "YYYY-MM"
): Promise<BudgetSpending | null> {
  const db = await connectDB()
  return db.collection('budget_spending').findOne({ 
    customerId, 
    month 
  }) as Promise<BudgetSpending | null>
}

/**
 * Update monthly spending - called when transactions are added/updated
 */
export async function updateMonthlySpending(
  customerId: string,
  month: string, // Format: "YYYY-MM"
  totalSpent: number,
  categorySpending: { category: string; amount: number }[]
): Promise<void> {
  const db = await connectDB()
  
  await db.collection('budget_spending').updateOne(
    { customerId, month },
    {
      $set: {
        totalSpent,
        categorySpending,
        updatedAt: new Date()
      },
      $setOnInsert: {
        customerId,
        month,
        createdAt: new Date()
      }
    },
    { upsert: true }
  )
}

/**
 * Calculate and update spending from transactions
 * Should be called whenever transactions are synced/updated
 */
export async function recalculateMonthlySpending(
  customerId: string,
  year: number,
  month: number // 0-11
): Promise<void> {
  const db = await connectDB()
  
  // Get all user accounts
  const userAccounts = await db
    .collection('accounts')
    .find({ customerId })
    .project({ id: 1 })
    .toArray()
  
  const accountIds = userAccounts.map((a: any) => a.id)
  
  // Get transactions for the specified month
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)
  
  const transactions = await db
    .collection('transactions')
    .find({
      accountId: { $in: accountIds },
      bookedDate: { $gte: startDate, $lte: endDate },
      amount: { $lt: 0 } // Only expenses
    })
    .toArray()
  
  // Calculate total spent
  const totalSpent = transactions.reduce((sum: any, t: any) => sum + Math.abs(parseFloat(t.amount)), 0)
  
  // Calculate category spending (you'll need to import categorizeTransaction)
  const categoryMap = new Map<string, number>()
  
  for (const transaction of transactions) {
    // Import categorizeTransaction function
    const { categorizeTransaction } = await import('@/app/components/analytics/utils/categorize-transaction')
    const category = categorizeTransaction(transaction.narration)
    const amount = Math.abs(parseFloat(transaction.amount))
    
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
  }
  
  const categorySpending = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount
  }))
  
  // Update spending record
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  await updateMonthlySpending(customerId, monthStr, totalSpent, categorySpending)
}

/**
 * Get budget with current spending data
 */
export async function getBudgetWithSpending(
  customerId: string
): Promise<Budget & { currentSpending?: BudgetSpending } | null> {
  const budget = await getBudget(customerId)
  if (!budget) return null
  
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const spending = await getMonthlySpending(customerId, monthStr)
  
  return {
    ...budget,
    currentSpending: spending || undefined
  }
}
