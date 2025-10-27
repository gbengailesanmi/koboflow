import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import BudgetClient from '@/app/components/budget/budget-page-client/budget-page-client'

export default async function BudgetPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  const userProfile = await db.collection('users').findOne({ customerId: user.customerId })
  
  if (!userProfile) {
    redirect(`/login`)
  }

  const transactionsDataRaw = await db
    .collection('transactions')
    .find({ customerId: user.customerId })
    .sort({ bookedDate: -1 })
    .toArray()

  const transactionsData = sanitizeArray(transactionsDataRaw)
  
  const profile = {
    name: userProfile.name || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'GBP',
    monthlyBudget: userProfile.monthlyBudget || 0
  }

  return <BudgetClient transactions={transactionsData} profile={profile} />
}
