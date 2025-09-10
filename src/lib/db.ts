import { connectDB } from '@/db/mongo'

export async function getDb() {
  return await connectDB()
}
