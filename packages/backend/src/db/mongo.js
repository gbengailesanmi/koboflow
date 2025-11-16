import { MongoClient } from 'mongodb'
import config from '../config'

const uri = config.MONGODB_URI
const dbName = config.MONGO_DB_NAME

if (!uri) {
  throw new Error('Missing MONGODB_URI')
}

let cachedClient = globalThis.__mongoClient
let cachedClientPromise = globalThis.__mongoClientPromise
let indexesCreated = false

async function ensureIndexes(db) {
  if (indexesCreated) return
  
  try {
    await db.collection('settings').createIndex({ customerId: 1 }, { unique: true })
    await db.collection('settings').createIndex({ updatedAt: -1 })
    
    indexesCreated = true
  } catch (error) {
    console.error('Error creating indexes:', error)
  }
}

export async function connectDB() {
  if (cachedClient) {
    return cachedClient.db(dbName)
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(uri)
    cachedClientPromise = client.connect().then(async () => {
      globalThis.__mongoClient = client
      console.log('MongoDB online ✅')
      
      const db = client.db(dbName)
      await ensureIndexes(db)
      
      return client
    })
    globalThis.__mongoClientPromise = cachedClientPromise
  }

  const client = await cachedClientPromise
  cachedClient = client
  return client.db(dbName)
}
