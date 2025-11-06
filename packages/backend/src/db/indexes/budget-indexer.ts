
import { connectDB } from '../mongo'

export async function createBudgetIndexes() {
  const db = await connectDB()
  
  await db.collection('budgets').createIndex(
    { customerId: 1 },
    { unique: true, name: 'customerId_unique' }
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

export async function migrateBudgetPeriod() {
  const db = await connectDB()
  const budgetsCollection = db.collection('budgets')
  
  const totalBudgets = await budgetsCollection.countDocuments()
  
  const result = await budgetsCollection.updateMany(
    { period: { $exists: false } },
    {
      $set: {
        period: {
          type: 'current-month'
        },
        updatedAt: new Date()
      }
    }
  )
    
  const budgetsWithPeriod = await budgetsCollection.countDocuments({
    period: { $exists: true }
  })
}

if (require.main === module) {
  Promise.all([
    createBudgetIndexes(),
    migrateBudgetPeriod()
  ])
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Failed:', error)
      process.exit(1)
    })
}
