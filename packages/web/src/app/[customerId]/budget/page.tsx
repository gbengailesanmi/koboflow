import { redirect } from 'next/navigation'
import { getSession, getTransactions, getCustomCategories, getBudgets } from '@/app/api/api-service'
import BudgetClient from './budget-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function BudgetPage({ params }: PageProps) {
  const { customerId } = await params

  // Fetch all data in parallel on the server
  const [session, transactions, customCategories, budgets] = await Promise.all([
    getSession(),
    getTransactions(),
    getCustomCategories(),
    getBudgets(),
  ])

  // Validate session
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  // Find active budget or use first one
  const activeBudget = budgets.find(b => b.isActive) || budgets[0] || null
  
  // Prepare budget data for backwards compatibility
  const initialBudget = activeBudget ? {
    _id: activeBudget._id,
    name: activeBudget.name,
    totalBudgetLimit: activeBudget.totalBudgetLimit,
    period: activeBudget.period || { type: 'current-month' as const },
    categories: activeBudget.categories || []
  } : {
    totalBudgetLimit: 0,
    period: { type: 'current-month' as const },
    categories: []
  }

  return (
    <BudgetClient
      customerId={customerId}
      allBudgets={budgets}
      initialBudget={initialBudget}
      transactions={transactions}
      customCategories={customCategories || []}
      currency="GBP"
    />
  )
}
