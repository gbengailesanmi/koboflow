import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import styles from './daily-spending-comparison.module.css'

type DailySpendingComparisonProps = {
  currentMonthAverage: number
  prevMonthAverage: number
  currentMonthName: string
  prevMonthName: string
  currency: string
}

export const DailySpendingComparison: React.FC<DailySpendingComparisonProps> = ({
  currentMonthAverage,
  prevMonthAverage,
  currentMonthName,
  prevMonthName,
  currency
}) => {
  const dailyChange = currentMonthAverage - prevMonthAverage
  const dailyPercentChange = prevMonthAverage > 0 
    ? ((dailyChange / prevMonthAverage) * 100) 
    : 0
  
  const isGoodChange = dailyChange < 0
  
  return (
    <div className={styles.comparisonStat}>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
        Average Daily Spending
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '120px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Current Month</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            {formatCurrency(Math.round(currentMonthAverage), currency)}/day
          </div>
        </div>
        <div style={{ fontSize: '20px', color: '#d1d5db' }}>→</div>
        <div style={{ flex: '1', minWidth: '120px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Previous Month</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#6b7280' }}>
            {formatCurrency(Math.round(prevMonthAverage), currency)}/day
          </div>
        </div>
      </div>
      <div style={{ 
        padding: '12px 16px', 
        borderRadius: '8px',
        background: isGoodChange ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        textAlign: 'center'
      }}>
        <span className={`${styles.comparisonValue} ${isGoodChange ? styles.incomeColor : styles.expenseColor}`} style={{ fontSize: '14px' }}>
          {isGoodChange ? '📉 ' : '📈 '}
          {isGoodChange ? 'Saving ' : 'Spending '}
          {formatCurrency(Math.abs(Math.round(dailyChange)), currency)} more per day
          {' '}({Math.abs(dailyPercentChange).toFixed(1)}% {isGoodChange ? 'less' : 'more'})
        </span>
      </div>
    </div>
  )
}
