'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'

import DashboardClient from '@/app/components/dashboard-client/dashboard-client'

export default async function Dashboard() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  const userProfile = await db.collection('users').findOne({ customerId: user.customerId })
  
  // If user doesn't exist in database, redirect to login
  // The auth-redirect route will handle signing them out
  if (!userProfile) {
    redirect(`/login`)
  }

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
    name: userProfile.name || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'GBP',
    totalBudgetLimit: userProfile.totalBudgetLimit || 0
  }

  return <DashboardClient accounts={accountsData} transactions={transactionsData} profile={profile} />
}
