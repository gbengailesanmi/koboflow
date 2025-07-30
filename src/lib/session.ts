import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      customerId: payload.customerId as string,
    }
  } catch {
    return null
  }
}
