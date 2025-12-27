import { redirect } from 'next/navigation'
import { getSession, getAccounts, getTransactions } from '@/lib/server/api-service'
import { TransactionsSkeleton } from '@/app/components/skeletons/transactions-skeleton'
import TransactionsClient from './transactions-client'

interface TransactionsPageProps {
  params: Promise<{ customerId: string }>
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  const { customerId } = await params

  const [session, accounts, transactions] = await Promise.all([
    getSession(),
    getAccounts(),
    getTransactions()
  ])

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
