'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import AnalyticsPageClient from '@/app/components/analytics-page-client/analytics-page-client'

export default async function AnalyticsPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  if (!db.collection('users').findOne({ customerId: user.customerId })) {
    redirect(`/login`)
  }

  // Get user profile data
  const userProfile = await db
    .collection('users')
    .findOne({ customerId: user.customerId })

  const accountsDataRaw = await db
    .collection('accounts')
    .find({ customerId: user.customerId })
    .toArray()

  const transactionsDataRaw = await db
    .collection('transactions')
    .find({ customerId: user.customerId })
    .sort({ bookedDate: -1 })
    .toArray()

  const accountsData = sanitizeArray(accountsDataRaw)
  const transactionsData = sanitizeArray(transactionsDataRaw)

  const profile = {
    name: userProfile?.name || 'User',
    email: userProfile?.email || '',
    currency: userProfile?.currency || 'USD',
    monthlyBudget: userProfile?.monthlyBudget || 5000
  }

  return (
    <AnalyticsPageClient 
      accounts={accountsData} 
      transactions={transactionsData}
      profile={profile}
    />
  )
}
