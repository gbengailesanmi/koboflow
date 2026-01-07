import { MongoClient, Db } from 'mongodb'
import config from '../config'
import { logger } from '@money-mapper/shared'

const uri = config.MONGODB_URI
const dbName = config.MONGO_DB_NAME

if (!uri) {
  throw new Error('Missing MONGODB_URI')
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

let indexesCreated = false

async function ensureIndexes(db: Db) {
  if (indexesCreated) return

  await db.collection('settings').createIndex({ customerId: 1 }, { unique: true })
  await db.collection('settings').createIndex({ updatedAt: -1 })
  await db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true })
  await db.collection('sessions').createIndex({ customerId: 1, status: 1 })
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

  indexesCreated = true
}

export async function connectDB(): Promise<Db> {
  if (globalThis.__mongoClient) {
    return globalThis.__mongoClient.db(dbName)
  }

  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(uri as string)
    globalThis.__mongoClientPromise = client.connect().then(async () => {
      globalThis.__mongoClient = client
      logger.info({ module: 'mongo', dbName }, 'MongoDB connection established')

      const db = client.db(dbName)
      await ensureIndexes(db)
      return client
    })
  }

  const client = await globalThis.__mongoClientPromise
  return client.db(dbName)
}
