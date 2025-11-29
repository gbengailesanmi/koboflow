import { connectDB } from '../mongo.js'

export async function createSettingsIndexes() {
  try {
    const db = await connectDB()
    const collection = db.collection('settings')

    // Create unique index on customerId
    await collection.createIndex(
      { customerId: 1 },
      { 
        unique: true,
        name: 'customerId_unique'
      }
    )

    // Create index for efficient lookups
    await collection.createIndex(
      { updatedAt: -1 },
      { name: 'updatedAt_desc' }
    )

    console.log('Settings indexes created successfully')
  } catch (error) {
    console.error('Error creating settings indexes:', error)
    throw error
  }
}
