'use server'

import { connectDB } from '@/db/mongo'
import bcrypt from 'bcrypt'
import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function login(_: any, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) return { message: 'All fields are required.' }

  const db = await connectDB()
  const user = await db.collection('users').findOne({ email })
  if (!user) return { message: 'Invalid credentials.' }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { message: 'Invalid credentials.' }

  // Create JWT token for session
  const token = await new SignJWT({ 
      userId: user._id, 
      customerId: user.customerId,
      name: user.name,
      email: user.email
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('3d')
    .sign(secret)

  // Set cookie for session
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'jwt_token',
    value: token,
    httpOnly: true,
    // sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect(`/${user.customerId}/dashboard`)
}
