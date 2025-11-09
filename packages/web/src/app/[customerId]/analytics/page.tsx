'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import AnalyticsPageClient from '@/app/components/analytics/analytics-page-client/analytics-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { AnalyticsSkeleton } from '@/app/components/skeletons/analytics-skeleton'

export default function AnalyticsPage() {
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

        const [accountsRes, transactionsRes, categoriesRes, settingsRes]: any[] = await Promise.all([
          apiClient.getAccounts(),
          apiClient.getTransactions(),
          apiClient.getCategories(),
          apiClient.getSettings(),
        ])

        setData({
          accounts: accountsRes.accounts || [],
          transactions: transactionsRes.transactions || [],
          customCategories: categoriesRes || [],
          settings: settingsRes.settings || {},
          profile: {
            customerId: sessionRes.user.customerId,
            email: sessionRes.user.email,
            firstName: sessionRes.user.firstName,
            lastName: sessionRes.user.lastName,
            currency: sessionRes.user.currency,
          },
        })
      } catch (error) {
        console.error('Failed to load analytics data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, router])

  if (loading || !data) {
    return <AnalyticsSkeleton customerId={customerId} />
  }

  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <AnalyticsPageClient
        accounts={data.accounts}
        transactions={data.transactions}
        customCategories={data.customCategories}
        profile={data.profile}
        pageColor={PAGE_COLORS.analytics}
      />
    </PageLayoutWithSidebar>
  )
}
