'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import AnalyticsPageClient from '@/app/components/analytics/analytics-page-client/analytics-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

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
  
  // Get custom categories
  const customCategoriesRaw = await db
    .collection('spending_categories')
    .find({ customerId: user.customerId })
    .sort({ createdAt: -1 })
    .toArray()
  
  const customCategories = sanitizeArray(customCategoriesRaw)

  const profile = {
    name: userProfile?.name || 'User',
    email: userProfile?.email || '',
    currency: userProfile?.currency || 'USD',
    totalBudgetLimit: userProfile?.totalBudgetLimit || 5000
  }

  const pageColor = userProfile?.accentColours?.analytics || PAGE_COLORS.analytics

  return (
    <PageLayoutWithSidebar customerId={user.customerId}>
      <AnalyticsPageClient 
        accounts={accountsData} 
        transactions={transactionsData}
        customCategories={customCategories}
        profile={profile}
        pageColor={pageColor}
      />
    </PageLayoutWithSidebar>
  )
}
