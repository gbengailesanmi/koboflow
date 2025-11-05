import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import SettingsPageClient from '@/app/components/settings/settings-page-client/settings-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { getUserSettings } from '@/lib/settings-helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function SettingsPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const session = await getSession()

  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  // Fetch user data from backend API
  const userResponse = await fetch(`${API_URL}/api/auth/user/${customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    redirect('/login')
  }

  const userData = await userResponse.json()
  const user = userData.user

  if (!user) {
    redirect('/login')
  }

  const userSettings = await getUserSettings(customerId)

  const pageColor = userSettings?.pageColors?.settings || PAGE_COLORS.settings

  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <SettingsPageClient
        customerId={customerId}
        userName={`${user.firstName} ${user.lastName}` || ''}
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
