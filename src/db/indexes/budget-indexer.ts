
import { connectDB } from '@/db/mongo'

/**
 * Create indexes for budgets and budget_spending collections
 */
export async function createBudgetIndexes() {
  const db = await connectDB()
  
  // Budgets collection indexes
  await db.collection('budgets').createIndex(
    { customerId: 1 },
    { unique: true, name: 'customerId_unique' }
  )
  
  await db.collection('budgets').createIndex(
    { updatedAt: -1 },
    { name: 'updatedAt_desc' }
  )
  
  // Budget spending collection indexes
  await db.collection('budget_spending').createIndex(
    { customerId: 1, month: 1 },
    { unique: true, name: 'customerId_month_unique' }
  )
  
  await db.collection('budget_spending').createIndex(
    { customerId: 1, updatedAt: -1 },
    { name: 'customerId_updatedAt' }
  )
  
  console.log('✅ Budget indexes created successfully')
}

// Run this script to create indexes
if (require.main === module) {
  createBudgetIndexes()
    .then(() => {
      console.log('Budget indexes setup complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to create budget indexes:', error)
      process.exit(1)
    })
}
