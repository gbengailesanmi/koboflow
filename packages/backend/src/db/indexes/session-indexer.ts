import { connectDB } from '../mongo.js'

async function createSessionIndexes() {
  try {
    const db = await connectDB()
    const collection = db.collection('sessions')

    await collection.createIndex(
      { sessionId: 1 },
      { 
        unique: true,
        name: 'sessionId_unique'
      }
    )

    await collection.createIndex(
      { customerId: 1 },
      { name: 'customerId_asc' }
    )

    await collection.createIndex(
      { expiresAt: 1 },
      { 
        expireAfterSeconds: 0, // Delete immediately when expiresAt is reached
        name: 'expiresAt_ttl'
      }
    )

    console.log('✅ Session indexes created successfully')
    console.log('  - sessionId_unique: Fast session lookups')
    console.log('  - customerId_asc: Find all sessions for a user')
    console.log('  - expiresAt_ttl: Automatic deletion of expired sessions')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating session indexes:', error)
    process.exit(1)
  }
}

createSessionIndexes()
