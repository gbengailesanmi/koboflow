'use client'

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../utils/format-currency'
import styles from './balance-history-chart.module.css'

type BalanceHistoryChartProps = {
  data: {
    currentMonth: { name: string }
    prevMonth: { name: string }
  }
  currency: string
  transactions: any[]
}

export const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ data, currency, transactions }) => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  const maxDays = Math.max(daysInCurrentMonth, daysInPrevMonth)

  const chartData = useMemo(() => {
    const dailyData = []
    let currentBalance = 0
    let prevBalance = 0
    
    for (let day = 1; day <= maxDays; day++) {
      // Calculate current month balance
      if (day <= daysInCurrentMonth) {
        const dayTransactions = transactions.filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === currentMonth &&
                 tDate.getFullYear() === currentYear
        })
        
        const dayIncome = dayTransactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        const dayExpense = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        currentBalance += dayIncome - dayExpense
      }

      // Calculate previous month balance
      if (day <= daysInPrevMonth) {
        const dayTransactions = transactions.filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === prevMonth &&
                 tDate.getFullYear() === prevYear
        })
        
        const dayIncome = dayTransactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        const dayExpense = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        prevBalance += dayIncome - dayExpense
      }

      dailyData.push({
        day: day.toString(),
        currentMonth: day <= daysInCurrentMonth ? currentBalance : null,
        previousMonth: day <= daysInPrevMonth ? prevBalance : null,
      })
    }
    
    return dailyData
  }, [currentMonth, currentYear, prevMonth, prevYear, transactions, daysInCurrentMonth, daysInPrevMonth, maxDays])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentData = payload.find((p: any) => p.dataKey === 'currentMonth')
      const previousData = payload.find((p: any) => p.dataKey === 'previousMonth')
      
      const currentValue = currentData?.value
      const previousValue = previousData?.value
      
      return (
        <div className={styles.rechartTooltip}>
          <p className={styles.rechartTooltipLabel}>{`Day ${label}`}</p>
          
          {currentValue !== null && currentValue !== undefined && (
            <p style={{ color: '#1f2937' }} className={styles.rechartTooltipValue}>
              {data.currentMonth.name}: {formatCurrency(currentValue, currency)}
            </p>
          )}
          
          {previousValue !== null && previousValue !== undefined && (
            <p style={{ color: '#6b7280' }} className={styles.rechartTooltipValue}>
              {data.prevMonth.name}: {formatCurrency(previousValue, currency)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: 'auto', minHeight: '200px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            ticks={['1', '15', maxDays.toString()]}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Previous month line - always visible */}
          <Line
            type="monotone"
            dataKey="previousMonth"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={true}
            name={data.prevMonth.name}
          />
          
          {/* Current month line - always visible */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#ffffff"
            strokeWidth={3}
            dot={false}
            connectNulls={true}
            name={data.currentMonth.name}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendLine} ${styles.legendLineSolid}`} />
          <span>{data.currentMonth.name}</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendLine} ${styles.legendLineDashed}`} />
          <span>{data.prevMonth.name}</span>
        </div>
      </div>
    </div>
  )
}
