import { connectDB } from '../mongo'

export async function createCustomCategoryIndexes() {
  const db = await connectDB()
  const collection = db.collection('spending_categories')

  await collection.createIndex({ customerId: 1 })

  await collection.createIndex({ customerId: 1, id: 1 }, { unique: true })

  await collection.createIndex({ customerId: 1, createdAt: -1 })

  console.log('Spending category indexes created successfully')
}
