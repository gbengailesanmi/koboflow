'use server'

import { signIn, auth } from '@/auth'
import { AuthError } from 'next-auth'

export async function login(_: any, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) {
    return { message: 'All fields are required.' }
  }

  try {
    // Note: signIn with redirect: false returns null on success or throws on error
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })
    
    if (result?.error) {
      return { message: 'Invalid credentials.' }
    }
    
    // Get the session to retrieve customerId
    const session = await auth()
    
    if (!session?.user?.customerId) {
      return { message: 'Login failed. Please try again.' }
    }
    
    // Return success with customerId for client-side redirect
    return {
      success: true,
      customerId: session.user.customerId,
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
