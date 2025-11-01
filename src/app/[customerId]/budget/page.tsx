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
  
  // Fetch budget from budget collection (takes precedence over profile)
  const budgetData = await db.collection('budgets').findOne({ customerId: user.customerId })
  
  // Get custom categories
  const customCategoriesRaw = await db
    .collection('spending_categories')
    .find({ customerId: user.customerId })
    .sort({ createdAt: -1 })
    .toArray()
  
  const customCategories = sanitizeArray(customCategoriesRaw)
  
  // Use budget collection value if it exists, otherwise fallback to profile, or 0 if neither exists
  const monthlyBudget = budgetData?.monthly ?? userProfile.monthlyBudget ?? 0
  
  const profile = {
    name: userProfile.name || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'GBP',
    monthlyBudget: monthlyBudget
  }

  return <BudgetClient transactions={transactionsData} profile={profile} customCategories={customCategories} />
}
