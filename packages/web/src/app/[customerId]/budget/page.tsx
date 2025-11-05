import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import BudgetClient from '@/app/components/budget/budget-page-client/budget-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function BudgetPage() {
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

  // Fetch budget from backend API
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
