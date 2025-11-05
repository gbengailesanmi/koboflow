'use server'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import AnalyticsPageClient from '@/app/components/analytics/analytics-page-client/analytics-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function AnalyticsPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  // Fetch user profile from backend API
  const userResponse = await fetch(`${API_URL}/api/auth/user/${user.customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    redirect(`/login`)
  }

  const userDataResponse = await userResponse.json()
  const userProfile = userDataResponse.user

  if (!userProfile) {
    redirect(`/login`)
  }

  // Fetch accounts from backend API
  const accountsResponse = await fetch(`${API_URL}/api/accounts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-id': user.customerId,
    },
    cache: 'no-store',
  })

  let accountsData = []
  if (accountsResponse.ok) {
    const accountsDataResponse = await accountsResponse.json()
    accountsData = sanitizeArray(accountsDataResponse.accounts || [])
  }

  // Fetch transactions from backend API
  const transactionsResponse = await fetch(`${API_URL}/api/transactions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-id': user.customerId,
    },
    cache: 'no-store',
  })

  let transactionsData = []
  if (transactionsResponse.ok) {
    const transactionsDataResponse = await transactionsResponse.json()
    transactionsData = sanitizeArray(transactionsDataResponse.transactions || [])
  }

  // Fetch custom categories from backend API
  const categoriesResponse = await fetch(`${API_URL}/api/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-id': user.customerId,
    },
    cache: 'no-store',
  })

  let customCategories = []
  if (categoriesResponse.ok) {
    const categoriesData = await categoriesResponse.json()
    customCategories = sanitizeArray(categoriesData.categories || [])
  }

  const profile = {
    firstName: userProfile.firstName || '',
    lastName: userProfile.lastName || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'USD',
    totalBudgetLimit: userProfile.totalBudgetLimit || 5000
  }

  const userSettings = await getUserSettings(user.customerId)
  const pageColor = userSettings?.pageColors?.analytics || PAGE_COLORS.analytics

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
