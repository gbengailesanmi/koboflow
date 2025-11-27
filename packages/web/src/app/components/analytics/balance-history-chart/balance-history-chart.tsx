'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
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
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [grayColor, setGrayColor] = useState('#6b7280')
  const [axisColor, setAxisColor] = useState('#6b7280')
  const [referenceLineColor, setReferenceLineColor] = useState('#9ca3af')

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     document.documentElement.classList.contains('dark-theme')
      setIsDarkMode(isDark)
    }

    const getAccentColor = () => {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()
      if (color) {
        setAccentColor(color)
      }
    }

    const getGrayColor = () => {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--gray-11').trim()
      if (color) {
        setGrayColor(color)
      }
    }

    const getAxisColor = () => {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--gray-10').trim()
      if (color) {
        setAxisColor(color)
      }
    }

    const getRefLineColor = () => {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--gray-7').trim()
      if (color) {
        setReferenceLineColor(color)
      }
    }

    checkDarkMode()
    getAccentColor()
    getGrayColor()
    getAxisColor()
    getRefLineColor()

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      checkDarkMode()
      getAccentColor()
      getGrayColor()
      getAxisColor()
      getRefLineColor()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme']
    })

    return () => observer.disconnect()
  }, [])
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  const maxDays = Math.max(daysInCurrentMonth, daysInPrevMonth)

  const chartData = useMemo(() => {
    const dailyData = []
    let currentExpenses = 0
    let prevExpenses = 0
    
    for (let day = 1; day <= maxDays; day++) {
      if (day <= daysInCurrentMonth) {
        const dayTransactions = transactions.filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === currentMonth &&
                 tDate.getFullYear() === currentYear
        })
        
        const dayExpense = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        currentExpenses += dayExpense
      }

      // Calculate previous month cumulative expenses
      if (day <= daysInPrevMonth) {
        const dayTransactions = transactions.filter((t: any) => {
          const tDate = t.date
          return tDate.getDate() === day &&
                 tDate.getMonth() === prevMonth &&
                 tDate.getFullYear() === prevYear
        })
        
        const dayExpense = dayTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
        
        prevExpenses += dayExpense
      }

      dailyData.push({
        day: day.toString(),
        currentMonth: day <= daysInCurrentMonth ? currentExpenses : null,
        previousMonth: day <= daysInPrevMonth ? prevExpenses : null,
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
            <p style={{ color: isDarkMode ? '#ffffff' : accentColor }} className={styles.rechartTooltipValue}>
              {data.currentMonth.name}: {formatCurrency(currentValue, currency)}
            </p>
          )}
          
          {previousValue !== null && previousValue !== undefined && (
            <p style={{ color: grayColor }} className={styles.rechartTooltipValue}>
              {data.prevMonth.name}: {formatCurrency(previousValue, currency)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const currentLineColor = isDarkMode ? '#ffffff' : accentColor
  const prevLineColor = grayColor


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
            tick={{ fontSize: 10, fill: axisColor }}
            ticks={['1', '15', maxDays.toString()]}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: axisColor }}
            tickFormatter={(value) => formatCurrency(value, currency)}
            domain={[0, 'auto']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine 
            x={currentDay.toString()} 
            stroke={referenceLineColor}
            strokeDasharray="1 1"
            strokeWidth={1}
            label={{ value: `Today ${currentDay}/${currentMonth + 1}`, position: 'top', fill: axisColor, fontSize: 10 }}
          />
          
          <Line
            type="bump"
            dataKey="previousMonth"
            stroke={prevLineColor}
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            connectNulls={true}
            name={data.prevMonth.name}
          />
          
          <Line
            type="bump"
            dataKey="currentMonth"
            stroke={currentLineColor}
            strokeWidth={2}
            dot={false}
            connectNulls={true}
            name={data.currentMonth.name}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div 
            className={styles.legendLine}
            style={{ 
              backgroundColor: currentLineColor,
              border: `1px solid ${currentLineColor}`
            }} 
          />
          <span>{data.currentMonth.name}</span>
        </div>
        <div className={styles.legendItem}>
          <div 
            className={styles.legendLine}
            style={{ 
              background: `repeating-linear-gradient(
                to right,
                ${prevLineColor} 0,
                ${prevLineColor} 4px,
                transparent 4px,
                transparent 8px
              )`,
              height: '2px'
            }} 
          />
          <span>{data.prevMonth.name}</span>
        </div>
      </div>
    </div>
  )
}
