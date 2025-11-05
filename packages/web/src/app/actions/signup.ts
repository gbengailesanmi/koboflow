'use server'

import { SignupFormSchema, FormState } from '@/lib/definitions'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

  try {
    // Call backend signup endpoint
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { message: data.message || 'Failed to create account.' }
    }

    if (data.success) {
      return { 
        success: true,
        requiresVerification: data.requiresVerification,
        message: data.message || 'Account created! Please check your email to verify your account.' 
      }
    }

    return { message: 'Failed to create account.' }
  } catch (err) {
    console.error('Signup error:', err)
    return { message: 'An unexpected error occurred. Please try again.' }
  }
}
