import { redirect } from 'next/navigation'
import { getSession, getTransactions, getCustomCategories, getBudget } from '@/lib/api-service'
import { BudgetSkeleton } from '@/app/components/skeletons/budget-skeleton'
import BudgetClient from './budget-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function BudgetPage({ params }: PageProps) {
  const { customerId } = await params

  // Fetch all data in parallel on the server
  const [session, transactions, customCategories, budgetRes] = await Promise.all([
    getSession(),
    getTransactions(),
    getCustomCategories(),
    getBudget(),
  ])

  // Validate session
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  // Prepare budget data
  const initialBudget = {
    totalBudgetLimit: budgetRes?.totalBudgetLimit || 0,
    period: budgetRes?.period || { type: 'current-month' as const },
    categories: budgetRes?.categories || []
  }

  return (
    <BudgetClient
      customerId={customerId}
      initialBudget={initialBudget}
      transactions={transactions}
      customCategories={customCategories || []}
      currency="GBP"
    />
  )
}
