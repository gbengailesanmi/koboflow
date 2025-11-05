'use server'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/app/components/profile/profile-page-client/profile-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function ProfilePage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect('/login')
  }

  // Fetch user data from backend API
  const userResponse = await fetch(`${API_URL}/api/auth/user/${user.customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    redirect('/login')
  }

  const userDataResponse = await userResponse.json()
  const userData = userDataResponse.user

  if (!userData) {
    redirect('/login')
  }

  // Fetch budget data from backend API
  const budgetResponse = await fetch(`${API_URL}/api/budget`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-id': user.customerId,
    },
    cache: 'no-store',
  })

  let totalBudgetLimit = 0
  if (budgetResponse.ok) {
    const budgetData = await budgetResponse.json()
    totalBudgetLimit = budgetData.budget?.monthly ?? 0
  }

  const sanitizedUser = {
    customerId: userData.customerId,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email,
    currency: userData.currency || 'GBP',
    totalBudgetLimit: totalBudgetLimit
  }

  const userSettings = await getUserSettings(user.customerId)
  const pageColor = userSettings?.pageColors?.profile || PAGE_COLORS.profile

  return (
    <PageLayoutWithSidebar customerId={user.customerId}>
      <ProfilePageClient user={sanitizedUser} pageColor={pageColor} />
    </PageLayoutWithSidebar>
  )
}