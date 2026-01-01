import { MongoClient, Db } from 'mongodb'
import { logger } from '@money-mapper/shared'
import config from '@/config'

const uri = config.MONGODB_URI
const DB_NAME = config.MONGO_DB_NAME

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient> | null = null

function getClientPromise(): Promise<MongoClient> {
  if (!uri || !DB_NAME) {
    const error = '[web] MONGODB_URI or MONGO_DB_NAME environment variable is not defined'
    logger.error(error)
    throw new Error(error)
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect().then((client) => {
      return client
    })
  }

  return global._mongoClientPromise
}

export default function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = getClientPromise()
  }
  return clientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db(DB_NAME!)
}
