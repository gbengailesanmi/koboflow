'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import SettingsPageClient from '@/app/components/settings/settings-page-client/settings-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { SettingsSkeleton } from '@/app/components/skeletons/settings-skeleton'

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes: any = await apiClient.getSession()
        if (!sessionRes.success || sessionRes.user.customerId !== customerId) {
          router.push('/login')
          return
        }

        const settingsRes: any = await apiClient.getSettings()

        setData({
          profile: {
            customerId: sessionRes.user.customerId,
            email: sessionRes.user.email,
            firstName: sessionRes.user.firstName,
            lastName: sessionRes.user.lastName,
            currency: sessionRes.user.currency,
          },
          settings: settingsRes.settings || {},
        })
      } catch (error) {
        console.error('Failed to load settings data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, router])

  if (loading || !data) {
    return <SettingsSkeleton customerId={customerId} />
  }

  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <SettingsPageClient
        customerId={customerId}
        userName={`${data.profile.firstName} ${data.profile.lastName}` || ''}
        userEmail={data.profile.email || ''}
        pageColor={data.settings?.pageColors?.settings || PAGE_COLORS.settings}
        preferences={{
          theme: data.settings?.theme || 'system',
          accentColor: data.settings?.accentColor || 'blue',
          notifications: data.settings?.notifications || {
            budgetAlerts: true,
            transactionUpdates: true,
            weeklyReports: false,
            monthlyReports: false,
          },
          security: data.settings?.security || {
            useFaceId: false,
          },
          pageColors: data.settings?.pageColors || undefined,
        }}
      />
    </PageLayoutWithSidebar>
  )
}
