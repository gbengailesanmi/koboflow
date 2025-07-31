import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from './db'
import { users } from '@/../drizzle/schema'
import { eq } from 'drizzle-orm'

export async function redirectIfAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;
  if (!token) return null

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!)
    )

    const result = await db
      .select()
      .from(users)
      .where(eq(users.customerId, payload.customerId as string))
      .limit(1)

    if (result.length === 0) return null

    const user = result[0]
    return payload.customerId as string

  } catch {
    return null
  }
}