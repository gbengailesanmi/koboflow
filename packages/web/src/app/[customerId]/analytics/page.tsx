import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions, getCustomCategories, getBudget } from '@/app/api/api-service'
import AnalyticsClient from './analytics-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { customerId } = await params

  const [session, accounts, transactions, customCategories, budgetRes] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions(),
    getCustomCategories(),
    getBudget(),
  ])

  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <AnalyticsClient
      customerId={customerId}
      accounts={accounts}
      transactions={transactions}
      customCategories={customCategories || []}
      currency="NGN"
      totalBudgetLimit={budgetRes?.totalBudgetLimit || 0}
    />
  )
}
