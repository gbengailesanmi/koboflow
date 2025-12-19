'use client'

import React, { useState, useMemo } from 'react'
import { Select, Flex, Text } from '@radix-ui/themes'
import { MonthOnMonthChart } from '../month-on-month-chart/month-on-month-chart'
import { DailySpendingComparison } from '../daily-spending-comparison/daily-spending-comparison'
import styles from './custom-date-comparison.module.css'

type CustomDateComparisonProps = {
  transactions: any[]
  currency: string
}

export const CustomDateComparison: React.FC<CustomDateComparisonProps> = ({ 
  transactions, 
  currency 
}) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const [startMonth, setStartMonth] = useState(currentMonth.toString())
  const [startYear, setStartYear] = useState(currentYear.toString())
  const [endMonth, setEndMonth] = useState((currentMonth === 0 ? 11 : currentMonth - 1).toString())
  const [endYear, setEndYear] = useState((currentMonth === 0 ? currentYear - 1 : currentYear).toString())

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)

  const comparisonData = useMemo(() => {
    const startMonthNum = parseInt(startMonth)
    const startYearNum = parseInt(startYear)
    const endMonthNum = parseInt(endMonth)
    const endYearNum = parseInt(endYear)

    const startMonthTransactions = transactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === startMonthNum &&
             transactionDate.getFullYear() === startYearNum
    })

    const endMonthTransactions = transactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === endMonthNum &&
             transactionDate.getFullYear() === endYearNum
    })

    const startIncome = startMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const startExpense = startMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    const endIncome = endMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const endExpense = endMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)

    const daysInStartMonth = new Date(startYearNum, startMonthNum + 1, 0).getDate()
    const daysInEndMonth = new Date(endYearNum, endMonthNum + 1, 0).getDate()

    const startDailyAvg = daysInStartMonth > 0 ? startExpense / daysInStartMonth : 0
    const endDailyAvg = daysInEndMonth > 0 ? endExpense / daysInEndMonth : 0

    return {
      currentMonth: {
        name: monthNamesShort[startMonthNum],
        income: startIncome,
        expense: startExpense,
        daysElapsed: daysInStartMonth,
        dailyAverage: startDailyAvg
      },
      prevMonth: {
        name: monthNamesShort[endMonthNum],
        income: endIncome,
        expense: endExpense,
        totalDays: daysInEndMonth,
        dailyAverage: endDailyAvg
      }
    }
  }, [startMonth, startYear, endMonth, endYear, transactions])

  return (
    <div className={styles.container}>
      <Flex className={styles.controls} gap="4" wrap="wrap" justify="center" align="center">
        <Flex gap="2" align="center">
          <Text size="2" weight="medium" className={styles.label}>Compare:</Text>
          <Select.Root value={startMonth} onValueChange={setStartMonth}>
            <Select.Trigger className={styles.select} />
            <Select.Content>
              {monthNames.map((month, index) => (
                <Select.Item key={index} value={index.toString()}>
                  {month}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={startYear} onValueChange={setStartYear}>
            <Select.Trigger className={styles.select} />
            <Select.Content>
              {years.map((year) => (
                <Select.Item key={year} value={year.toString()}>
                  {year}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Text size="2" weight="medium" className={styles.vsText}>vs</Text>

        <Flex gap="2" align="center">
          <Select.Root value={endMonth} onValueChange={setEndMonth}>
            <Select.Trigger className={styles.select} />
            <Select.Content>
              {monthNames.map((month, index) => (
                <Select.Item key={index} value={index.toString()}>
                  {month}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={endYear} onValueChange={setEndYear}>
            <Select.Trigger className={styles.select} />
            <Select.Content>
              {years.map((year) => (
                <Select.Item key={year} value={year.toString()}>
                  {year}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      <div className={styles.chartWrapper}>
        <MonthOnMonthChart 
          data={comparisonData}
          currency={currency}
          transactions={transactions}
          customStartMonth={parseInt(startMonth)}
          customStartYear={parseInt(startYear)}
          customEndMonth={parseInt(endMonth)}
          customEndYear={parseInt(endYear)}
        />
        <div className={styles.comparisonStats}>
          <DailySpendingComparison
            currentMonthAverage={comparisonData.currentMonth.dailyAverage}
            prevMonthAverage={comparisonData.prevMonth.dailyAverage}
            currentMonthName={`${monthNames[parseInt(startMonth)]} ${startYear}`}
            prevMonthName={`${monthNames[parseInt(endMonth)]} ${endYear}`}
            currency={currency}
            showBadge={false}
          />
        </div>
      </div>
    </div>
  )
}
