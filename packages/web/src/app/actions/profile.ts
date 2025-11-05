'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

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

    // Connect to database
    const db = await connectDB()

    // Check if email is already taken by another user
    const existingUser = await db.collection('users').findOne({ 
      email: email.toLowerCase().trim(), 
      customerId: { $ne: user.customerId } 
    })

    if (existingUser) {
      return { error: 'Email is already taken' }
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      updatedAt: new Date()
    }

    // Add optional fields if provided
    if (currency) {
      updateData.currency = currency
    }
    if (totalBudgetLimit !== undefined && totalBudgetLimit >= 0) {
      updateData.totalBudgetLimit = totalBudgetLimit
    }

    const result = await db.collection('users').updateOne(
      { customerId: user.customerId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return { error: 'User not found' }
    }

    // If total budget limit was updated, sync it to the budget collection
    // (but only if no budget exists yet - Budget page takes precedence)
    if (totalBudgetLimit !== undefined && totalBudgetLimit >= 0) {
      const budgetCollection = db.collection('budgets')
      const existingBudget = await budgetCollection.findOne({ customerId: user.customerId })
      
      if (!existingBudget) {
        await budgetCollection.updateOne(
          { customerId: user.customerId },
          { 
            $set: { 
              totalBudgetLimit: totalBudgetLimit,
              updatedAt: new Date()
            },
            $setOnInsert: {
              categories: [],
              createdAt: new Date()
            }
          },
          { upsert: true }
        )
      }
    }

    revalidatePath(`/${user.customerId}/profile`)

    return { success: 'Profile updated successfully!' }

  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
