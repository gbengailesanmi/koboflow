import React from 'react'
import { Skeleton } from '@radix-ui/themes'

interface SettingsSkeletonProps {
  customerId: string
}

export function SettingsSkeleton({ customerId }: SettingsSkeletonProps) {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <Skeleton height="60px" />
        
        {/* Settings sections */}
        <Skeleton height="150px" />
        <Skeleton height="150px" />
        <Skeleton height="150px" />
        <Skeleton height="150px" />
      </div>
  )
}
