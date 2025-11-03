'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { connectDB } from '@/db/mongo'

export async function login(_: any, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) {
    return { message: 'All fields are required.' }
  }

  try {
    // signIn with redirect: false will throw on error, return null on success
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })
    
    // Get customerId directly from database since session might not be ready yet
    const db = await connectDB()
    const user = await db.collection('users').findOne({ email })
    
    if (!user?.customerId) {
      console.error('No customerId found for user:', email)
      return { message: 'Login failed. Account setup incomplete. Please contact support.' }
    }
        
    // Return success with customerId for client-side redirect
    return {
      success: true,
      customerId: user.customerId,
      message: 'Login successful!'
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Invalid credentials.' }
        default:
          return { message: 'An error occurred during login.' }
      }
    }
    // Check if it's our custom verification error
    if (error instanceof Error && error.message.includes('verify your email')) {
      return { message: error.message }
    }
    throw error
  }
}
