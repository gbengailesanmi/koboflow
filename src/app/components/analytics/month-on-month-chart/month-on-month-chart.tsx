'use client'

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../utils/format-currency'
import styles from './month-on-month-chart.module.css'

type MonthOnMonthChartProps = {
  data: {
    currentMonth: { name: string; income: number; expense: number }
    prevMonth: { name: string; income: number; expense: number }
  }
  currency: string
  transactions: any[]
}

export const MonthOnMonthChart: React.FC<MonthOnMonthChartProps> = ({ data, currency, transactions }) => {
  // Get current date
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // Calculate previous month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  // Get days in current month
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Generate daily expense data for comparison - span entire month
  const chartData = useMemo(() => {
    const dailyData = []
    
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      // Current month transactions for this day
      const currentDayExpenses = transactions
        .filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === currentMonth &&
                 tDate.getFullYear() === currentYear &&
                 t.type === 'expense'
        })
        .reduce((sum: number, t: any) => sum + t.numericAmount, 0)

      // Previous month transactions for the same day
      const prevDayExpenses = transactions
        .filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === prevMonth &&
                 tDate.getFullYear() === prevYear &&
                 t.type === 'expense'
        })
        .reduce((sum: number, t: any) => sum + t.numericAmount, 0)

      dailyData.push({
        day: day.toString(),
        currentMonth: currentDayExpenses,
        previousMonth: prevDayExpenses,
      })
    }
    
    return dailyData
  }, [currentMonth, currentYear, prevMonth, prevYear, transactions, daysInCurrentMonth])

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.rechartTooltip}>
          <p className={styles.rechartTooltipLabel}>{`Day ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className={styles.rechartTooltipValue}>
              💸 {entry.dataKey === 'currentMonth' ? data.currentMonth.name : data.prevMonth.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {/* <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" /> */}
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            interval={Math.floor(daysInCurrentMonth / 8)} // Show fewer labels for better readability
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="currentMonth" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name={`${data.currentMonth.name} ${currentYear}`}
          />
          <Line 
            type="monotone" 
            dataKey="previousMonth" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            name={`${data.prevMonth.name} ${prevYear}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
