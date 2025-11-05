import { connectDB } from '../mongo'

export async function createCustomCategoryIndexes() {
  const db = await connectDB()
  const collection = db.collection('spending_categories')

  // Create index on customerId for fast filtering
  await collection.createIndex({ customerId: 1 })

  // Create compound index for efficient lookups
  await collection.createIndex({ customerId: 1, id: 1 }, { unique: true })

  // Create index for ordering by creation date
  await collection.createIndex({ customerId: 1, createdAt: -1 })

  console.log('Spending category indexes created successfully')
}
