'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    
    // Get customerId from backend API
    // First, we need to login to get the user data
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      return { message: 'Login failed. Please try again.' }
    }

    const data = await response.json()
    
    if (!data.success || !data.user?.customerId) {
      console.error('No customerId found for user:', email)
      return { message: 'Login failed. Account setup incomplete. Please contact support.' }
    }
    
    console.log('Login successful for:', email, 'customerId:', data.user.customerId)
        
    // Return success with customerId for client-side redirect
    return {
      success: true,
      customerId: data.user.customerId,
      message: 'Login successful!'
    }
  } catch (error) {
    // Don't catch Next.js redirect errors - let them propagate
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error
      }
    }
    
    console.error('Login error:', error)
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Invalid credentials.' }
        default:
          return { message: 'An error occurred during login.' }
      }
    }
    
    // Check if it's our custom verification error
    if (error instanceof Error) {
      if (error.message.includes('verify your email')) {
        return { message: error.message }
      }
      // Return any other error message
      return { message: error.message || 'An error occurred during login.' }
    }
    
    // Fallback for unknown errors
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}
