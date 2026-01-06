import { getAccounts, getTransactions, getBudget } from '@/lib/api/api-service'
import DashboardClient from './dashboard-client'
import DashboardThemeWrapper from '../../components/dashboard/dashboard-theme'
import { DashboardBackgroundProvider } from '@/providers/dashboard-background-provider'
import { DASHBOARD_SLIDE_COLORS } from '@money-mapper/shared'

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
      <DashboardBackgroundProvider colors={DASHBOARD_SLIDE_COLORS}>
        <DashboardClient
          customerId={customerId}
          accounts={accounts}
          transactions={transactions}
        />
      </DashboardBackgroundProvider>
    </DashboardThemeWrapper>
  )
}
