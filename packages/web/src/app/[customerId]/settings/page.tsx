import { redirect } from 'next/navigation'
import { getSession, getSettings } from '@/lib/api-service'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import SettingsClient from './settings-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { customerId } = await params

  // Fetch data in parallel on the server
  const [session, settings] = await Promise.all([
    getSession(),
    getSettings(),
  ])

  // Validate session
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <SettingsClient
      customerId={customerId}
      firstName={session.firstName}
      lastName={session.lastName}
      email={session.email}
      initialTheme={settings?.theme || 'system'}
      initialAccentColor={settings?.accentColor || 'blue'}
      initialNotifications={{
        budgetAlerts: settings?.notifications?.email?.budgetAlerts ?? true,
        transactionUpdates: settings?.notifications?.email?.transactionAlerts ?? true,
        weeklyReports: settings?.notifications?.email?.weeklyReport ?? false,
        monthlyReports: settings?.notifications?.email?.monthlyReport ?? false,
      }}
      initialUseFaceId={false}
      initialPageColors={settings?.pageColors || {
        analytics: PAGE_COLORS.analytics,
        budget: PAGE_COLORS.budget,
        profile: PAGE_COLORS.profile,
        settings: PAGE_COLORS.settings,
        transactions: PAGE_COLORS.transactions,
        dashboard: PAGE_COLORS.dashboard,
      }}
    />
  )
}
