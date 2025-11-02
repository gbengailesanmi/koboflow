import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { auth } from '@/auth'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function getSession() {
  // First, try NextAuth session (for Google OAuth)
  const nextAuthSession = await auth()
  if (nextAuthSession?.user?.customerId) {
    return {
      customerId: nextAuthSession.user.customerId as string,
    }
  }

  // Fallback to JWT session (for email/password login)
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      customerId: payload.customerId as string,
    }
  } catch {
    return null
  }
}
