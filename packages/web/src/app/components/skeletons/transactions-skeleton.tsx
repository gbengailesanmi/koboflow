import React from 'react'
import { Skeleton } from '@radix-ui/themes'

interface TransactionsSkeletonProps {
  customerId: string
}

export function TransactionsSkeleton({ customerId }: TransactionsSkeletonProps) {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header with filters */}
        <Skeleton height="60px" />
        
        {/* Filter bar */}
        <Skeleton height="50px" />
        
        {/* Transactions table/list */}
        <Skeleton height="600px" />
      </div>
  )
}
