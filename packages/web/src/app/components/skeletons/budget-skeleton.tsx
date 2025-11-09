import React from 'react'
import { Skeleton } from '@radix-ui/themes'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'

interface BudgetSkeletonProps {
  customerId: string
}

export function BudgetSkeleton({ customerId }: BudgetSkeletonProps) {
  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton height="60px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
        <Skeleton height="400px" />
        <Skeleton height="300px" />
      </div>
    </PageLayoutWithSidebar>
  )
}
