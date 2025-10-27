import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import styles from './stats-cards.module.css'

type StatsCardsProps = {
  totalIncome: number
  totalExpense: number
  netBalance: number
  incomeTransactionCount: number
  expenseTransactionCount: number
  currency: string
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalIncome,
  totalExpense,
  netBalance,
  incomeTransactionCount,
  expenseTransactionCount,
  currency
}) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statsCard}>
        <div className={styles.statsCardHeader}>
          <div className={styles.statsCardTitle}>
            💰 Total Income
          </div>
        </div>
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${styles.incomeColor}`}>
            {formatCurrency(totalIncome, currency)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {incomeTransactionCount} transactions
          </div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.statsCardHeader}>
          <div className={styles.statsCardTitle}>
            💸 Total Expenses
          </div>
        </div>
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${styles.expenseColor}`}>
            {formatCurrency(totalExpense, currency)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {expenseTransactionCount} transactions
          </div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.statsCardHeader}>
          <div className={styles.statsCardTitle}>
            📊 Net Balance
          </div>
        </div>
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${netBalance >= 0 ? styles.incomeColor : styles.expenseColor}`}>
            {formatCurrency(netBalance, currency)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {netBalance >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
          </div>
        </div>
      </div>
    </div>
  )
}
