import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function redirectIfAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;
  if (!token) return null

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!)
    )

    return payload.customerId as string
  } catch {
    return null
  }
}