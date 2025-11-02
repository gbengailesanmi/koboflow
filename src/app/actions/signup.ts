'use server'

import { SignupFormSchema, FormState } from '@/lib/definitions'
import { connectDB } from '@/db/mongo'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail } from '@/lib/email'
import { createUserSettings } from '@/lib/settings-helpers'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

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
    passwordConfirm: formData.get('passwordConfirm')?.toString() || '' 
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
    
    // Combine first and last name
    const name = `${firstName} ${lastName}`
    
    // Generate email verification token
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const insertResult = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name,
      firstName,
      lastName,
      customerId,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      createdAt: new Date(),
    })

    if (!insertResult.insertedId) {
      return { message: 'Failed to create user.' }
    }
    
    // Create default settings for the new user
    await createUserSettings(customerId)
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, name, verificationToken)
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Continue with signup even if email fails - user can request another verification email
    }

    // Do NOT auto-login after signup - redirect to verification pending page
    return { message: 'signup successful - verification email sent' }
  } catch (err) {
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}
