import { redirect } from 'next/navigation'
import { getAccounts, getTransactions, getCustomCategories, getBudget } from '@/lib/api/api-service'
import AnalyticsClient from './analytics-client'
import { getServerSession } from '@/lib/api/get-server-session'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { customerId } = await params

  const [session, accounts, transactions, customCategories, budgetRes] = await Promise.all([
    getServerSession(),
    getAccounts(),
    getTransactions(),
    getCustomCategories(),
    getBudget(),
  ])

  if (!session || session.user.customerId !== customerId) {
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
