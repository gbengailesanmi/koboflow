'use server'

import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function updateProfile(
  data: { firstName: string; lastName: string; email: string; currency?: string; totalBudgetLimit?: number }
): Promise<{ error?: string; success?: string }> {
  const { firstName, lastName, email, currency, totalBudgetLimit } = data

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return { error: 'First name, last name, and email are required' }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email format' }
  }

  try {
    // Get current user session
    const user = await getSession()
    if (!user?.customerId) {
      return { error: 'Unauthorized' }
    }

    // Call backend API to update user profile
    const response = await fetch(`${API_URL}/api/auth/user/${user.customerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        currency,
        totalBudgetLimit
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { error: responseData.message || 'Failed to update profile' }
    }

    if (!responseData.success) {
      return { error: responseData.message || 'Failed to update profile' }
    }

    revalidatePath(`/${user.customerId}/profile`)

    return { success: 'Profile updated successfully!' }

  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
