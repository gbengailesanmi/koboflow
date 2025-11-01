'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/app/components/profile/profile-page-client/profile-page-client'

export default async function ProfilePage() {
  const user = await getSession()


  const db = await connectDB()

  const userData = await db.collection('users').findOne({ customerId: user?.customerId })

  if (!userData) {
    redirect(`/login`)
  }

  // Fetch budget from budget collection (takes precedence over profile)
  const budgetData = await db.collection('budgets').findOne({ customerId: user?.customerId })
  
  // Use budget collection value if it exists, otherwise fallback to profile, or 0 if neither exists
  const monthlyBudget = budgetData?.monthly ?? userData.monthlyBudget ?? 0

  // Remove sensitive data before passing to client
  const sanitizedUser = {
    customerId: userData.customerId,
    name: userData.name,
    email: userData.email,
    currency: userData.currency,
    monthlyBudget: monthlyBudget
  }

  return <ProfilePageClient user={sanitizedUser} />
}