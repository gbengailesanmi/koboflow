import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions, getBudget } from '@/app/api/api-service'
import DashboardClient from './dashboard-client'
import DashboardThemeWrapper from './utils/dashboard-theme'

interface DashboardPageProps {
  params: Promise<{ customerId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { customerId } = await params

  const [session, accounts, transactions, budgetRes] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions(),
    getBudget()
  ])

  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  const profile = {
    name: `${session.firstName} ${session.lastName}`,
    email: session.email,
    currency: 'NGN',
    totalBudgetLimit: budgetRes?.totalBudgetLimit || 0,
  }

  return (
    <DashboardThemeWrapper>
      <DashboardClient
        customerId={customerId}
        accounts={accounts}
        transactions={transactions}
        profile={profile}
      />
    </DashboardThemeWrapper>
  )
}
