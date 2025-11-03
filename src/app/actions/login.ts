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
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      redirectTo: '/auth-redirect'
    })
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
