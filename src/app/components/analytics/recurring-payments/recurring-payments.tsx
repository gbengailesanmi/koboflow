'use client'

import React, { useMemo } from 'react'
import { detectRecurringPayments } from '../utils/detect-recurring-payments'
import { formatCurrency } from '../utils/format-currency'
import { redirect, useParams } from 'next/navigation'
import styles from './recurring-payments.module.css'

type RecurringPaymentsProps = {
  transactions: any[]
  currency: string
  maxItems?: number
  showSeeMore?: boolean
}

export const RecurringPayments: React.FC<RecurringPaymentsProps> = ({ 
  transactions, 
  currency,
  maxItems = 3,
  showSeeMore = true
}) => {
  const params = useParams()
  const customerId = params.customerId as string

  const recurringPayments = useMemo(() => {
    return detectRecurringPayments(transactions)
  }, [transactions])

  if (recurringPayments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>🔄</div>
        <p>No recurring payments detected</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {recurringPayments.slice(0, maxItems).map((recurring, index) => (
        <div 
          key={`${recurring.pattern}-${index}`}
          className={styles.recurringItem}
        >
          <div className={styles.recurringItemLeft}>
            <div className={styles.categoryIcon}>
              {recurring.category === 'utilities' ? '⚡' :
               recurring.category === 'housing' ? '🏠' :
               recurring.category === 'transport' ? '🚗' :
               recurring.category === 'entertainment' ? '🎮' : '💳'}
            </div>
            <div className={styles.itemDetails}>
              <span className={styles.itemName}>
                {recurring.pattern}
              </span>
              <span className={styles.itemFrequency}>
                Every {recurring.intervalDays} days
              </span>
            </div>
          </div>
          <div className={styles.recurringItemRight}>
            <span className={styles.itemAmount}>
              {formatCurrency(recurring.averageAmount, currency)}
            </span>
            <span className={styles.itemDate}>
              {recurring.nextPayment.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
          </div>
        </div>
      ))}
      {showSeeMore && recurringPayments.length > maxItems && (
        <div
          className={styles.seeMore}
          onClick={() => redirect(`/${customerId}/analytics`)}
        >
          +{recurringPayments.length - maxItems} more in Analytics
        </div>
      )}
    </div>
  )
}
