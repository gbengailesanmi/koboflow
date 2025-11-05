'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import SettingsPageClient from '@/app/components/settings/settings-page-client/settings-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

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

        const [profileRes, settingsRes]: any[] = await Promise.all([
          fetch(`/api/auth/user/${customerId}`).then(r => r.json()),
          apiClient.getSettings(),
        ])

        setData({
          profile: profileRes.user || {},
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
    return (
      <PageLayoutWithSidebar customerId={customerId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </PageLayoutWithSidebar>
    )
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
