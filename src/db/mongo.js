import { MongoClient } from 'mongodb'

let db = null
let client = null

export async function connectDB() {
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    db = client.db(process.env.MONGO_DB_NAME || 'moneymapper_db')
    console.log('✅ Connected to MongoDB')
  }
  return db
}
