import { redirect } from 'next/navigation'
import { getSession, getSettings } from '@/lib/server/api-service'
import SettingsClient from './settings-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { customerId } = await params

  const [session, settings] = await Promise.all([
    getSession(),
    getSettings(),
  ])

  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <SettingsClient
      customerId={customerId}
      firstName={session.firstName}
      lastName={session.lastName}
      email={session.email}
      initialSettings={settings}
    />
  )
}
