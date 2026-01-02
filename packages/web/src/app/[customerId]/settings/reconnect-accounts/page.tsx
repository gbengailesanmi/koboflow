import { getServerSession } from '@/lib/api/get-server-session'
import { getAccounts } from '@/lib/api/api-service'
import { redirect } from 'next/navigation'
import ReconnectAccountsClient from './reconnect-accounts-client'

export default async function ReconnectAccountsPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  const accounts = await getAccounts()

  return (
    <ReconnectAccountsClient
      customerId={customerId}
      accounts={accounts}
    />
  )
}
