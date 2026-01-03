'use client'

import useSWR from 'swr'
import Sidebar from '@/app/components/sidebar/sidebar'
import { UserInfoCard } from '@/app/components/user-info-card'
import { PageHeader } from '@/app/components/page-header/page-header'
import Footer from '@/app/components/footer/footer'
import { staticSWR } from '@/lib/swr'
import type { CustomerDetailsFromMono } from '@money-mapper/shared'
import styles from './personal-details.module.css'

type PersonalDetailsClientProps = {
  customerId: string
}

export default function PersonalDetailsClient({
  customerId,
}: PersonalDetailsClientProps) {
  const { data, error, isLoading } = useSWR<{ customerDetailsFromMono: CustomerDetailsFromMono }>(
    '/api/user/details',
    staticSWR
  )

  const customerDetails = data?.customerDetailsFromMono

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
    <Sidebar customerId={customerId}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <PageHeader 
            title="Personal Details"
            subtitle="Your personal information from bank verification"
          />
          
          {renderContent()}
        </div>
        <Footer buttonColor='#222222' opacity={50} />
      </div>
    </Sidebar>
  )
}
