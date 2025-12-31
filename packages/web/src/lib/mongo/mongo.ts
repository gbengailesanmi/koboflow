import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
const DB_NAME = 'moneymapper_db'

if (!uri) {
  throw new Error('❌ MONGODB_URI is not defined in web environment')
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri)
  global._mongoClientPromise = client.connect().then((client) => {
    console.log('[MONGO] connected')
    console.log('[MONGO] using database:', DB_NAME)
    return client
  })
}

clientPromise = global._mongoClientPromise

/**
 * 🔹 Use this when a library (NextAuth adapter) needs the client
 */
export default clientPromise

/**
 * 🔹 Use this everywhere YOU query Mongo
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db(DB_NAME)
}
