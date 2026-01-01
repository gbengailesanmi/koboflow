import { redirect } from 'next/navigation'
import { getAccounts, getTransactions, getBudget } from '@/lib/server/api-service'
import DashboardClient from './dashboard-client'
import DashboardThemeWrapper from './utils/dashboard-theme'
import { getServerSession } from '@/lib/server/get-server-session'

interface DashboardPageProps {
  params: Promise<{ customerId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { customerId } = await params

  const [session, accounts, transactions, budgetRes] = await Promise.all([
    getServerSession(),
    getAccounts(),
    getTransactions(),
    getBudget()
  ])

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  const profile = {
    firstName: session.user.firstName ?? '',
    lastName: session.user.lastName ?? '',
    email: session.user.email ?? '',
    currency: 'NGN',
    totalBudgetLimit: budgetRes?.totalBudgetLimit ?? 0,
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
