'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function login(_: any, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) {
    return { message: 'All fields are required.' }
  }

  try {
    // Note: signIn will throw a NEXT_REDIRECT error on success, which is expected behavior
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      redirectTo: '/auth-redirect'
    })
  } catch (error) {
    // Check if it's a redirect error (which is expected and means success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw redirect errors to let Next.js handle them
    }
    
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
