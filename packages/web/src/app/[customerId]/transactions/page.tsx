'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import TransactionsPageClient from '@/app/components/transactions/transactions-page-client/transactions-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

export default function TransactionsPage() {
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

        const [accountsRes, transactionsRes, categoriesRes, settingsRes, profileRes]: any[] = await Promise.all([
          fetch(`/api/accounts?customerId=${customerId}`).then(r => r.json()),
          apiClient.getTransactions(),
          apiClient.getCategories(),
          apiClient.getSettings(),
          fetch(`/api/auth/user/${customerId}`).then(r => r.json()),
        ])

        setData({
          accounts: accountsRes.accounts || [],
          transactions: transactionsRes.transactions || [],
          customCategories: categoriesRes || [],
          settings: settingsRes.settings || {},
          profile: profileRes.user || {},
        })
      } catch (error) {
        console.error('Failed to load transactions data:', error)
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
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </PageLayoutWithSidebar>
    )
  }

  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <TransactionsPageClient
        accounts={data.accounts}
        transactions={data.transactions}
        pageColor={PAGE_COLORS.transactions}
      />
    </PageLayoutWithSidebar>
  )
}
