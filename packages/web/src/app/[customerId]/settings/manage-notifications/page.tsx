import { getServerSession } from '@/lib/server/get-server-session'
import { getSettings } from '@/lib/server/api-service'
import { redirect } from 'next/navigation'
import ManageNotificationsClient from './manage-notifications-client'

export default async function ManageNotificationsPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  const settings = await getSettings()

  return (
    <ManageNotificationsClient
      customerId={customerId}
      initialSettings={settings}
    />
  )
}
