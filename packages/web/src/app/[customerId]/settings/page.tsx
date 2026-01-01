import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/server/api-service'
import SettingsClient from './settings-client'
import { getServerSession } from '@/lib/server/get-server-session'
type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { customerId } = await params

  const [session, settings] = await Promise.all([
    getServerSession(),
    getSettings(),
  ])

  if (!session?.user?.customerId || session.user.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <SettingsClient
      customerId={customerId}
      firstName={session.user.firstName ?? ''}
      lastName={session.user.lastName ?? ''}
      email={session.user.email ?? ''}
      initialSettings={settings}
    />
  )
}
