import { connectDB } from '../mongo'
import { logger } from '@koboflow/shared'

export async function createSettingsIndexes() {
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

    logger.info({ module: 'settings-indexes' }, 'Settings indexes created successfully')
  } catch (error) {
    logger.error({ module: 'settings-indexes', error }, 'Error creating settings indexes')
    throw error
  }
}
