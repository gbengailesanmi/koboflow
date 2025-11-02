import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import BudgetClient from '@/app/components/budget/budget-page-client/budget-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

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
  
  const totalBudgetLimit = budgetData?.monthly ?? userProfile.totalBudgetLimit ?? 0
  
  const profile = {
    name: userProfile.name || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'GBP',
    totalBudgetLimit: totalBudgetLimit
  }

  const userSettings = await getUserSettings(user.customerId)
  const pageColor = userSettings?.pageColors?.budget || PAGE_COLORS.budget

  return (
    <PageLayoutWithSidebar customerId={user.customerId}>
      <BudgetClient transactions={transactionsData} profile={profile} customCategories={customCategories} pageColor={pageColor} />
    </PageLayoutWithSidebar>
  )
}
