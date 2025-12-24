import React from 'react'
import { Separator, Text } from '@radix-ui/themes'
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
          <Text className={`${styles.statsValue} ${netBalance >= 0 ? styles.incomeColor : styles.expenseColor}`}>
            {formatCurrency(netBalance, currency)}
          </Text>
        </div>
        <div className={styles.statsCardFooter}>
          <Text className={styles.statsCardTitle} size="1">
            Net Balance
          </Text>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{incomeTransactionCount + expenseTransactionCount}</span>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" size="4" className={styles.separator} />

      <div className={styles.statsCard}>
        <div className={styles.statsCardContent}>
          <Text className={`${styles.statsValue} ${styles.incomeColor}`}>
            {formatCurrency(totalIncome, currency)}
          </Text>
        </div>
        <div className={styles.statsCardFooter}>
          <Text className={styles.statsCardTitle} size="1">
            Total Income
          </Text>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{incomeTransactionCount}</span>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" size="4" color="gray" className={styles.separator} />

      <div className={styles.statsCard}>
        <div className={styles.statsCardContent}>
          <Text className={`${styles.statsValue} ${styles.expenseColor}`}>
            {formatCurrency(totalExpense, currency)}
          </Text>
        </div>
        <div className={styles.statsCardFooter}>
          <Text className={styles.statsCardTitle} size="1">
            Total Spend
          </Text>
          <div className={styles.transactionBadge}>
            <ValueIcon className={styles.badgeIcon} />
            <span className={styles.badgeNumber}>{expenseTransactionCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
