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
    const allRecurring = detectRecurringPayments(transactions)
    
    // Separate overdue and current/future payments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdue: typeof allRecurring = []
    const currentAndFuture: typeof allRecurring = []
    
    allRecurring.forEach(payment => {
      const nextDate = new Date(payment.nextPayment)
      nextDate.setHours(0, 0, 0, 0)
      
      if (nextDate.getTime() < today.getTime()) {
        overdue.push(payment)
      } else {
        currentAndFuture.push(payment)
      }
    })
    
    // Take only 1 overdue payment (the most recent one) and combine with current/future
    const limitedOverdue = overdue.slice(0, 1)
    return [...limitedOverdue, ...currentAndFuture]
  }, [transactions])

  if (recurringPayments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>🔄</div>
        <p>No recurring payments detected</p>
      </div>
    )
  }

  const getDaysUntilPayment = (nextPaymentDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const next = new Date(nextPaymentDate)
    next.setHours(0, 0, 0, 0)
    const diffTime = next.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'in 1 day'
    if (diffDays < 0) return 'Overdue'
    return `in ${diffDays} days`
  }

  return (
    <div className={styles.container}>
      {recurringPayments.slice(0, maxItems).map((recurring, index) => {
        const daysUntil = getDaysUntilPayment(recurring.nextPayment)
        const nextPaymentFormatted = recurring.nextPayment.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long' 
        })
        
        return (
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
                {nextPaymentFormatted}, {daysUntil}
              </span>
            </div>
          </div>
        )
      })}
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
