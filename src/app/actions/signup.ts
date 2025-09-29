'use server'

import { SignupFormSchema, FormState } from '@/lib/definitions'
import { connectDB } from '@/db/mongo'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name')?.toString().trim() || ''
  const email = formData.get('email')?.toString().trim().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''
  const passwordConfirm = formData.get('passwordConfirm')?.toString() || ''

  if (!name || !email || !password || !passwordConfirm) {
    return { message: 'All fields are required.' }
  }
  const parsed = SignupFormSchema.safeParse({ name, email, password, passwordConfirm: formData.get('passwordConfirm')?.toString() || '' })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const db = await connectDB()
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

    // Issue JWT and set cookie so the user is auto-logged-in after signup
    const token = await new SignJWT({
      userId: insertResult.insertedId.toString(),
      customerId,
      name,
      email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('3d')
      .sign(secret)

    const cookieStore = await cookies()
    cookieStore.set({
      name: 'jwt_token',
      value: token,
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { message: 'signup successful' }
  } catch (err) {
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}
