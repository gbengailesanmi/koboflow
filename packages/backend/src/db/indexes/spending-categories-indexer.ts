/**
 * Database Indexes for user_categories collection
 * 
 * Collection structure: ONE document per user containing all categories
 */

import { connectDB } from '../mongo'

const COLLECTION = 'spending_categories'

export async function ensureUserCategoriesIndexes() {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)

  console.log(`Creating indexes for ${COLLECTION} collection...`)

  await collection.createIndex(
    { customerId: 1 },
    { unique: true, name: 'idx_customerId_unique' }
  )

  await collection.createIndex(
    { 'categories.id': 1 },
    { name: 'idx_categories_id' }
  )

  // Index on categories.keywords for transaction categorization
  await collection.createIndex(
    { 'categories.keywords': 1 },
    { name: 'idx_categories_keywords' }
  )

  console.log(`✓ ${COLLECTION} indexes created successfully`)
}

// Run if executed directly
if (require.main === module) {
  ensureUserCategoriesIndexes()
    .then(() => {
      console.log('Index creation completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Index creation failed:', error)
      process.exit(1)
    })
}
