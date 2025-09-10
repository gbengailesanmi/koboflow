import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getDb } from './db'

export async function redirectIfAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!)
    )

    const db = await getDb()
    const result = await db.collection('users').findOne({ customerId: payload.customerId as string })

    if (!result) return null

    return payload.customerId as string

  } catch {
    return null
  }
}