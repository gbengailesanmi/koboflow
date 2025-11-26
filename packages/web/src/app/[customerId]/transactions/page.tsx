import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions } from '@/app/api/api-service'
import { TransactionsSkeleton } from '@/app/components/skeletons/transactions-skeleton'
import TransactionsClient from './transactions-client'

interface TransactionsPageProps {
  params: Promise<{ customerId: string }>
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  const { customerId } = await params

  // Parallel data fetching on server
  const [session, accounts, transactions] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions()
  ])

  // Redirect if not authenticated or wrong user
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <TransactionsClient
      customerId={customerId}
      accounts={accounts}
      transactions={transactions}
    />
  )
}
