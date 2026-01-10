'use client'

import useSWR from 'swr'
import { useCallback, useEffect } from 'react'
import { UserInfoCard } from '@/app/components/settings/user-info-card'
import { usePageTitle } from '@/providers/header-footer-provider'
import { cachedSWR } from '@/lib/swr'
import type { CustomerDetailsFromMono } from '@koboflow/shared'
import styles from './personal-details.module.css'

type PersonalDetailsClientProps = {
  customerId: string
}

export default function PersonalDetailsClient({
  customerId,
}: PersonalDetailsClientProps) {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Personal Details', 'Your personal information from bank verification')
  }, [])

  const { data, error, isLoading, isValidating } = useSWR<{ customerDetailsFromMono: CustomerDetailsFromMono }>(
    '/api/user/details',
    cachedSWR
  )

  const customerDetails = data?.customerDetailsFromMono

  useEffect(() => {
    if (data && !isValidating && !isLoading) {
      console.log('✅ Fresh data loaded')
    } else if (data && isValidating) {
      console.log('🔄 Using cached data, fetching fresh data in background...')
    } else if (isLoading) {
      console.log('⏳ Loading data for first time...')
    }
  }, [data, isLoading, isValidating])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Loading your personal details...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Error: {error.message || 'Failed to load details'}</p>
        </div>
      )
    }

    if (!customerDetails) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No bank account linked yet. Link your bank account to view your verified personal details.
          </p>
        </div>
      )
    }

    return (
      <UserInfoCard
        title="Bank Verification Details"
        subtitle="Information verified from your linked bank account"
        customerDetailsFromMono={customerDetails}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {renderContent()}
      </div>
    </div>
  )
}
