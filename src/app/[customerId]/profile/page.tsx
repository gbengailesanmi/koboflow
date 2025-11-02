'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/app/components/profile/profile-page-client/profile-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

export default async function ProfilePage() {
  const user = await getSession()


  const db = await connectDB()

  const userData = await db.collection('users').findOne({ customerId: user?.customerId })

  if (!userData) {
    redirect(`/login`)
  }

  const budgetData = await db.collection('budgets').findOne({ customerId: user?.customerId })
  
  const totalBudgetLimit = budgetData?.monthly ?? userData.totalBudgetLimit ?? 0

  const sanitizedUser = {
    customerId: userData.customerId,
    name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    email: userData.email,
    currency: userData.currency,
    totalBudgetLimit: totalBudgetLimit
  }

  const userSettings = await getUserSettings(user?.customerId || '')
  const pageColor = userSettings?.pageColors?.profile || PAGE_COLORS.profile

  return (
    <PageLayoutWithSidebar customerId={user?.customerId || ''}>
      <ProfilePageClient user={sanitizedUser} pageColor={pageColor} />
    </PageLayoutWithSidebar>
  )
}