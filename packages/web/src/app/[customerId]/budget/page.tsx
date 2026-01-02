import { redirect } from 'next/navigation'
import { getTransactions, getCustomCategories, getBudgets } from '@/lib/api/api-service'
import BudgetClient from './budget-client'
import { getServerSession } from '@/lib/api/get-server-session'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function BudgetPage({ params }: PageProps) {
  const { customerId } = await params

  const [session, transactions, customCategories, budgets] = await Promise.all([
    getServerSession(),
    getTransactions(),
    getCustomCategories(),
    getBudgets(),
  ])

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  const activeBudget = budgets.find(b => b.isActive) || budgets[0] || null
  
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
      currency="NGN"
    />
  )
}
