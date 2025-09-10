'use server'

import { SignupFormSchema, FormState } from '@/lib/definitions'
import { getDb } from '@/lib/db'
import bcrypt from 'bcrypt'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'


export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name')?.toString().trim() || ''
  const email = formData.get('email')?.toString().trim().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!name || !email || !password) {
    return { message: 'All fields are required.' }
  }
  const parsed = SignupFormSchema.safeParse({ name, email, password })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const db = await getDb()
  const existing = await db.collection('users').findOne({ email })
  if (existing) {
    return { message: 'Email is already registered.' }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const customerId = uuidv4()

    const insertResult = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name,
      customerId,
    })

    if (!insertResult.insertedId) {
      return { message: 'Failed to create user.' }
    }

    return { message: 'signup successful' }
  } catch (err) {
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function login(_: any, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) return { message: 'All fields are required.' }

  const db = await getDb()
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
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'jwt_token',
    value: token,
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect(`/${user.customerId}/dashboard`)
}
