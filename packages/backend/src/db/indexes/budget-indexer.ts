
import { connectDB } from '../mongo'
import { logger } from '@money-mapper/shared'

export async function createBudgetIndexes() {
  const db = await connectDB()
  
  try {
    await db.collection('budgets').dropIndex('customerId_unique')
  } catch (error) {
  }
  
  await db.collection('budgets').createIndex(
    { customerId: 1, isActive: -1 },
    { name: 'customerId_isActive' }
  )
  
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
      logger.info({ module: 'budget-indexer' }, 'Budget indexes created successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error({ module: 'budget-indexer', error }, 'Failed to create budget indexes')
      process.exit(1)
    })
}
