/**
 * Database Indexes for user_categories collection
 * 
 * Collection structure: ONE document per user containing all categories
 */

import { connectDB } from '../mongo'
import { logger } from '@koboflow/shared'

const COLLECTION = 'spending_categories'

export async function ensureUserCategoriesIndexes() {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)

  logger.info({ module: 'spending-categories-indexer', collection: COLLECTION }, 'Creating indexes for collection')

  await collection.createIndex(
    { customerId: 1 },
    { unique: true, name: 'idx_customerId_unique' }
  )

  await collection.createIndex(
    { 'categories.id': 1 },
    { name: 'idx_categories_id' }
  )

  await collection.createIndex(
    { 'categories.keywords': 1 },
    { name: 'idx_categories_keywords' }
  )

  logger.info({ module: 'spending-categories-indexer', collection: COLLECTION }, 'Indexes created successfully')
}

if (require.main === module) {
  ensureUserCategoriesIndexes()
    .then(() => {
      logger.info({ module: 'spending-categories-indexer' }, 'Index creation completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error({ module: 'spending-categories-indexer', error }, 'Index creation failed')
      process.exit(1)
    })
}
