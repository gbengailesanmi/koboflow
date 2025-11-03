'use server'

import { SignupFormSchema, FormState } from '@/lib/definitions'
import { connectDB } from '@/db/mongo'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { createUserSettings } from '@/lib/settings-helpers'
import { signIn } from '@/auth'

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const firstName = formData.get('firstName')?.toString().trim() || ''
  const lastName = formData.get('lastName')?.toString().trim() || ''
  const email = formData.get('email')?.toString().trim().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''
  const passwordConfirm = formData.get('passwordConfirm')?.toString() || ''

  if (!firstName || !lastName || !email || !password || !passwordConfirm) {
    return { message: 'All fields are required.' }
  }
  
  const parsed = SignupFormSchema.safeParse({ 
    firstName, 
    lastName, 
    email, 
    password, 
    passwordConfirm 
  })
  
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
      firstName,
      lastName,
      customerId,
      emailVerified: true, // Auto-verify for now, can add email verification later
      createdAt: new Date(),
      authProvider: 'credentials'
    })

    if (!insertResult.insertedId) {
      return { message: 'Failed to create user.' }
    }
    
    await createUserSettings(customerId)
    
    // Auto-login after successful signup
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      redirectTo: '/auth-redirect'
    })
    
    return { message: 'signup successful' }
  } catch (err) {
    console.error('Signup error:', err)
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}
