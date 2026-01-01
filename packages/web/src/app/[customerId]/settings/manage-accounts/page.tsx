import { getServerSession } from '@/lib/server/get-server-session'
import { getAccounts } from '@/lib/server/api-service'
import { redirect } from 'next/navigation'
import ManageAccountsClient from './manage-accounts-client'

export default async function ManageAccountsPage({
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
    <ManageAccountsClient
      customerId={customerId}
      accounts={accounts}
      currency="NGN"
    />
  )
}
