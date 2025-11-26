import React from 'react'
import { Separator } from '@radix-ui/themes'
import { ValueIcon } from '@radix-ui/react-icons'
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
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${netBalance >= 0 ? styles.incomeColor : styles.expenseColor}`}>
            {formatCurrency(netBalance, currency)}
          </div>
        </div>
        <div className={styles.statsCardFooter}>
          <div className={styles.statsCardTitle}>
            Net Balance
          </div>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{incomeTransactionCount + expenseTransactionCount}</span>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" size="4" className={styles.separator} />

      <div className={styles.statsCard}>
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${styles.incomeColor}`}>
            {formatCurrency(totalIncome, currency)}
          </div>
        </div>
        <div className={styles.statsCardFooter}>
          <div className={styles.statsCardTitle}>
            Total Income
          </div>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{incomeTransactionCount}</span>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" size="4" color="gray" className={styles.separator} />

      <div className={styles.statsCard}>
        <div className={styles.statsCardContent}>
          <div className={`${styles.statsValue} ${styles.expenseColor}`}>
            {formatCurrency(totalExpense, currency)}
          </div>
        </div>
        <div className={styles.statsCardFooter}>
          <div className={styles.statsCardTitle}>
            Total Spend
          </div>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{expenseTransactionCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
