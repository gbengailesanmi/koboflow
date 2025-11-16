import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions } from '@/lib/api-service'
import { DashboardSkeleton } from '@/app/components/skeletons/dashboard-skeleton'
import DashboardClient from './dashboard-client'

interface DashboardPageProps {
  params: Promise<{ customerId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { customerId } = await params

  // Parallel data fetching on server - automatically cached by Next.js 15
  const [session, accounts, transactions] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions()
  ])

  // Redirect if not authenticated or wrong user
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  // Build profile from session data
  const profile = {
    name: `${session.firstName} ${session.lastName}`,
    email: session.email,
    currency: session.currency || 'SEK',
    totalBudgetLimit: session.totalBudgetLimit || 0,
  }

  // Server Component passes data to Client Component
  return (
    <DashboardClient
      customerId={customerId}
      accounts={accounts}
      transactions={transactions}
      profile={profile}
    />
  )
}
