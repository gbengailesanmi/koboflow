import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { connectDB } from '@/db/mongo'
import SettingsPageClient from '@/app/components/settings/settings-page-client/settings-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

export default async function SettingsPage({ params }: { params: { customerId: string } }) {
  const session = await getSession()

  if (!session || session.customerId !== params.customerId) {
    redirect('/login')
  }

  // Fetch user data
  const db = await connectDB()
  const user = await db.collection('users').findOne({ customerId: params.customerId })

  if (!user) {
    redirect('/login')
  }

  // Get page color from user profile or use default
  const pageColor = user?.accentColours?.settings || PAGE_COLORS.settings

  return (
    <PageLayoutWithSidebar customerId={params.customerId}>
      <SettingsPageClient
        customerId={params.customerId}
        userName={user.name || ''}
        userEmail={user.email || ''}
        pageColor={pageColor}
        preferences={{
          theme: user.theme || 'system',
          accentColor: user.accentColor || 'blue',
          notifications: user.notifications || {
            budgetAlerts: true,
            transactionUpdates: true,
            weeklyReports: false,
            monthlyReports: true
          },
          security: {
            useFaceId: user.useFaceId || false
          },
          accentColours: user.accentColours || {
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
