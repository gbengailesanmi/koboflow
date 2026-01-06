import { redirect } from 'next/navigation'
import { getAccounts, getTransactions, getBudget } from '@/lib/api/api-service'
import DashboardClient from './dashboard-client'
import DashboardThemeWrapper from '../../components/dashboard/dashboard-theme'
import { getServerSession } from '@/lib/api/get-server-session'

interface DashboardPageProps {
  params: Promise<{ customerId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { customerId } = await params

  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions()
  ])

  return (
    <DashboardThemeWrapper>
      <DashboardClient
        customerId={customerId}
        accounts={accounts}
        transactions={transactions}
      />
    </DashboardThemeWrapper>
  )
}
