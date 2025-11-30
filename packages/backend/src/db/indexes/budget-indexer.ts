
import { connectDB } from '../mongo'

export async function createBudgetIndexes() {
  const db = await connectDB()
  
  // Remove old unique index if it exists
  try {
    await db.collection('budgets').dropIndex('customerId_unique')
  } catch (error) {
    // Index doesn't exist, that's fine
  }
  
  // Compound index for efficient queries by customer and active status
  await db.collection('budgets').createIndex(
    { customerId: 1, isActive: -1 },
    { name: 'customerId_isActive' }
  )
  
  // Index for finding budgets by customerId
  await db.collection('budgets').createIndex(
    { customerId: 1, createdAt: -1 },
    { name: 'customerId_createdAt' }
  )
  
  await db.collection('budgets').createIndex(
    { updatedAt: -1 },
    { name: 'updatedAt_desc' }
  )
  
  await db.collection('budgets').createIndex(
    { 'period.type': 1 },
    { name: 'period_type', sparse: true }
  )
  
  await db.collection('budgets').createIndex(
    { 'period.startDate': 1 },
    { name: 'period_startDate', sparse: true }
  )
}

if (require.main === module) {
  createBudgetIndexes()
    .then(() => {
      console.log('✅ Budget indexes created successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Failed to create budget indexes:', error)
      process.exit(1)
    })
}
