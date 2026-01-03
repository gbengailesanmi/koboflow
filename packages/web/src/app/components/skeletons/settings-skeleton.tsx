import React from 'react'
import { Skeleton } from '@radix-ui/themes'
import PageLayoutWithSidebar from '@/app/components/page-sidebar/sidebar'

interface SettingsSkeletonProps {
  customerId: string
}

export function SettingsSkeleton({ customerId }: SettingsSkeletonProps) {
  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <Skeleton height="60px" />
        
        {/* Settings sections */}
        <Skeleton height="150px" />
        <Skeleton height="150px" />
        <Skeleton height="150px" />
        <Skeleton height="150px" />
      </div>
    </PageLayoutWithSidebar>
  )
}
