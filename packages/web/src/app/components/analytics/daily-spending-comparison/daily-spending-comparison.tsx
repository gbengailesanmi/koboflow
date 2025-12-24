import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import styles from './daily-spending-comparison.module.css'

type DailySpendingComparisonProps = {
  currentMonthAverage: number
  prevMonthAverage: number
  currentMonthName: string
  prevMonthName: string
  currency: string
  showBadge?: boolean
}

export const DailySpendingComparison: React.FC<DailySpendingComparisonProps> = ({
  currentMonthAverage,
  prevMonthAverage,
  currentMonthName,
  prevMonthName,
  currency,
  showBadge = true
}) => {
  const dailyChange = currentMonthAverage - prevMonthAverage
  const dailyPercentChange = prevMonthAverage > 0 
    ? ((dailyChange / prevMonthAverage) * 100) 
    : 0
  
  const isGoodChange = dailyChange < 0
  
  return (
    <div className={styles.comparisonStat}>
      <div className={styles.container}>
        <div className={styles.statBox}>
          <div className={styles.label}>{currentMonthName}</div>
          <div className={styles.value}>
            {formatCurrency(Math.round(currentMonthAverage), currency)}/day
          </div>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.statBox}>
          <div className={styles.label}>{prevMonthName}</div>
          <div className={styles.valuePrev}>
            {formatCurrency(Math.round(prevMonthAverage), currency)}/day
          </div>
        </div>
      </div>
      {showBadge && (
        <div className={`${styles.badge} ${isGoodChange ? styles.badgeGood : styles.badgeExpense}`}>
          <span className={`${styles.comparisonValue} ${isGoodChange ? styles.incomeColor : styles.expenseColor}`}>
            You are
            {isGoodChange ? ' saving ' : ' spending '}
            {formatCurrency(Math.abs(Math.round(dailyChange)), currency)} more per day
            {' '}({Math.abs(dailyPercentChange).toFixed(1)}% {isGoodChange ? 'less' : 'more'})
          </span>
        </div>
      )}
    </div>
  )
}
