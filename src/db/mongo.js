import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGO_DB_NAME

if (!uri) {
  throw new Error('Missing MONGODB_URI')
}

// Use globalThis to cache the MongoClient across module reloads / serverless invocations
// This makes connection reuse safe in serverless environments (Vercel, AWS Lambda, etc.).
let cachedClient = globalThis.__mongoClient
let cachedClientPromise = globalThis.__mongoClientPromise

export async function connectDB() {
  if (cachedClient) {
    return cachedClient.db(dbName)
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(uri)
    cachedClientPromise = client.connect().then(() => {
      globalThis.__mongoClient = client
      console.log('MongoDB online ✅')
      return client
    })
    globalThis.__mongoClientPromise = cachedClientPromise
  }

  const client = await cachedClientPromise
  // update local cachedClient in case it wasn't set yet
  cachedClient = client
  return client.db(dbName)
}
