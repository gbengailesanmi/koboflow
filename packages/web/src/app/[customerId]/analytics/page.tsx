import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions, getCustomCategories, getBudget } from '@/lib/api-service'
import AnalyticsClient from './analytics-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { customerId } = await params

  // Fetch all data in parallel on the server
  const [session, accounts, transactions, customCategories, budgetRes] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions(),
    getCustomCategories(),
    getBudget(),
  ])

  // Validate session
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <AnalyticsClient
      customerId={customerId}
      accounts={accounts}
      transactions={transactions}
      customCategories={customCategories || []}
      currency="GBP"
      totalBudgetLimit={budgetRes?.totalBudgetLimit || 0}
    />
  )
}
