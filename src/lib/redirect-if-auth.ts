import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/db/mongo'

// function decodeJwtExpiry(token: string) {
//   try {
//     const parts = token.split('.')
//     if (parts.length !== 3) return null
//     const payloadJson = Buffer.from(
//       parts[1].replace(/-/g, '+').replace(/_/g, '/'),
//       'base64'
//     ).toString('utf8')
//     const payload = JSON.parse(payloadJson)
//     if (!payload.exp) return { exp: null, expiresAt: null }
//     const exp = Number(payload.exp)
//     return { exp, expiresAt: new Date(exp * 1000).toISOString() }
//   } catch {
//     return null
//   }
// }

export async function redirectIfAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')?.value
  if (!token) return null

  // const expiryInfo = decodeJwtExpiry(token)
  // console.log('jwt_token expiry:', expiryInfo)

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!)
    )

    const db = await connectDB()
    const result = await db.collection('users').findOne({ customerId: payload.customerId as string })

    if (!result) return null

    return payload.customerId as string

  } catch {
    return null
  }
}