import React from 'react'
import { Skeleton } from '@radix-ui/themes'
import PageLayoutWithSidebar from '@/app/components/sidebar/sidebar'

interface AnalyticsSkeletonProps {
  customerId: string
}

export function AnalyticsSkeleton({ customerId }: AnalyticsSkeletonProps) {
  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <Skeleton height="60px" />
        
        {/* Analytics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
        
        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
          <Skeleton height="350px" />
          <Skeleton height="350px" />
        </div>
        
        {/* Additional Charts */}
        <Skeleton height="300px" />
      </div>
    </PageLayoutWithSidebar>
  )
}
