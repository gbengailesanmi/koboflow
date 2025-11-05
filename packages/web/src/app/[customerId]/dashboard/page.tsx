'use server'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'

import DashboardClient from '@/app/components/dashboard-client/dashboard-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function Dashboard() {
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

  const profile = {
    name: `${userProfile.firstName} ${userProfile.lastName}` || '',
    email: userProfile.email || '',
    currency: userProfile.currency || 'GBP',
    totalBudgetLimit: userProfile.totalBudgetLimit || 0
  }

  return <DashboardClient accounts={accountsData} transactions={transactionsData} profile={profile} />
}
