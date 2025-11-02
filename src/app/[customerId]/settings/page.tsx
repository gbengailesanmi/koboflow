import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { connectDB } from '@/db/mongo'
import SettingsPageClient from '@/app/components/settings/settings-page-client/settings-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

export default async function SettingsPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const session = await getSession()

  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  // Fetch user data
  const db = await connectDB()
  const user = await db.collection('users').findOne({ customerId })

  if (!user) {
    redirect('/login')
  }

  // Get user settings (includes pageColors)
  const userSettings = await getUserSettings(customerId)

  // Get page color from settings or use default
  const pageColor = userSettings?.pageColors?.settings || PAGE_COLORS.settings

  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <SettingsPageClient
        customerId={customerId}
        userName={user.name || ''}
        userEmail={user.email || ''}
        pageColor={pageColor}
        preferences={{
          theme: userSettings?.theme || 'system',
          accentColor: userSettings?.accentColor || 'blue',
          notifications: userSettings?.notifications?.email || {
            budgetAlerts: true,
            transactionUpdates: true,
            weeklyReports: false,
            monthlyReports: true
          },
          security: {
            useFaceId: user.useFaceId || false
          },
          pageColors: userSettings?.pageColors || {
            analytics: PAGE_COLORS.analytics,
            budget: PAGE_COLORS.budget,
            profile: PAGE_COLORS.profile,
            settings: PAGE_COLORS.settings,
            transactions: PAGE_COLORS.transactions,
            dashboard: PAGE_COLORS.dashboard,
          }
        }}
      />
    </PageLayoutWithSidebar>
  )
}
