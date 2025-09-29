'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function updateProfile(
  prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  // Validate input
  if (!name?.trim() || !email?.trim()) {
    return { error: 'Name and email are required' }
  }

  try {
    // Get current user session
    const user = await getSession()
    if (!user?.customerId) {
      return { error: 'Unauthorized' }
    }

    // Connect to database
    const db = await connectDB()

    // Update user profile
    const result = await db.collection('users').updateOne(
      { customerId: user.customerId },
      { 
        $set: { 
          name: name.trim(), 
          email: email.trim(),
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return { error: 'User not found' }
    }

    // Revalidate the profile page to show updated data
    revalidatePath(`/${user.customerId}/profile`)

    return { success: 'Profile updated successfully!' }

  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
