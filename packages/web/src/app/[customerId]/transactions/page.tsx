import { redirect } from 'next/navigation'
import TransactionsClient from './transactions-client'
import { getServerSession } from '@/lib/api/get-server-session'

interface TransactionsPageProps {
  params: Promise<{ customerId: string }>
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  const { customerId } = await params

  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  return <TransactionsClient />
}
