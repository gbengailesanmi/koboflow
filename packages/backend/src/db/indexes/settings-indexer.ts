import { connectDB } from '../mongo'
import { logger } from '@money-mapper/shared'

async function createSettingsIndexes() {
  try {
    const db = await connectDB()
    const collection = db.collection('settings')

    await collection.createIndex(
      { customerId: 1 },
      { 
        unique: true,
        name: 'customerId_unique'
      }
    )

    await collection.createIndex(
      { updatedAt: -1 },
      { name: 'updatedAt_desc' }
    )

    process.exit(0)
  } catch (error) {
    logger.error({ module: 'settings-indexer', error }, 'Error creating settings indexes')
    process.exit(1)
  }
}

createSettingsIndexes()
