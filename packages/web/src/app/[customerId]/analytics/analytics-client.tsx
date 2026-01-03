///Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/web/src/app/[customerId]/analytics/analytics-client.tsx
'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@radix-ui/themes'
import type { Account, EnrichedTransaction } from '@money-mapper/shared'
import type {  } from '@money-mapper/shared'
import type { CustomCategory } from '@/types/custom-category'
import { categoryCreateAction, categoryDeleteAction, categoryUpdateAction } from '@/app/actions/category.actions'
import { usePageTitle } from '@/providers/header-footer-provider'
import { PageLayout } from '@/app/components/page-layout/page-layout'
import AccountFilterMenu from '@/app/components/account-filter-menu/account-filter-menu'
import { categorizeTransaction, getCategoryConfig } from '@/app/components/analytics/utils'
import {
  PieChart,
  TreemapChart,
  BubbleChart,
  BalanceHistoryChart,
  MonthOnMonthChart,
  ChartPlaceholder,
} from '@/app/components/charts'
import {
  AnalyticsCard,
  RecurringPayments,
  StatsCards,
  CategoryBreakdown,
  DailySpendingComparison,
  // CustomCategoriesManager
} from '@/app/components/analytics'
import { EmptyState } from '@/app/components/empty-state'
import { useQueryStateNullable, useQueryState } from '@/hooks/use-query-state'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'
import { 
  Grid, 
  Tabs,
  Text,
  Flex,
  Box
} from '@radix-ui/themes'
import styles from './analytics.module.css'

type AnalyticsClientProps = {
  customerId: string
  accounts: Account[]
  transactions: EnrichedTransaction[]
  customCategories: CustomCategory[]
  currency: string
  totalBudgetLimit: number
}

export default function AnalyticsClient({
  customerId,
  accounts,
  transactions,
  customCategories,
  currency,
  totalBudgetLimit
}: AnalyticsClientProps) {
  const router = useRouter()
  
  // URL state for account filter and settings
  const [selectedAccountId, setSelectedAccountId] = useQueryStateNullable('accountId')
  const [timePeriod, setTimePeriod] = useQueryState('period', 'month')
  
  // Local UI state
  const [showAccountFilter, setShowAccountFilter] = useState(false)
  const [currentChartIndex, setCurrentChartIndex] = useState(0)
  
  // Restore scroll position when navigating back
  useScrollRestoration()
  
  const effectiveAccountId = selectedAccountId || 'all'

  const categoryConfig = useMemo(() => getCategoryConfig(customCategories), [customCategories])

  const handleAddCategory = useCallback(async (name: string, keywords: string[]) => {
    try {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      await categoryCreateAction({ 
        name, 
        keywords, 
        color: randomColor 
      })
      
      router.refresh()
    } catch (error) {
      // Error handled
    }
  }, [router])

  const handleDeleteCategory = useCallback(async (id: string) => {
    try {
      await categoryDeleteAction(id)
      router.refresh()
    } catch (error) {
      // Error handled
    }
  }, [router])

  const handleUpdateCategory = useCallback(async (id: string, updates: { name?: string; keywords?: string[]; color?: string }) => {
    try {
      const result = await categoryUpdateAction(id, updates)
      
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      // Error handled
    }
  }, [router])

  const handleNextChart = useCallback(() => {
    setCurrentChartIndex((prev) => (prev + 1) % 4) // Cycle through 0, 1, 2, 3
  }, [])

  const handlePrevChart = useCallback(() => {
    setCurrentChartIndex((prev) => (prev - 1 + 4) % 4) // Cycle through 0, 1, 2, 3
  }, [])

  const processedTransactions = useMemo(() => {
    let filteredByAccount = transactions
    
    if (effectiveAccountId !== 'all') {
      filteredByAccount = transactions.filter(transaction => 
        transaction.accountId === effectiveAccountId
      )
    }
    
    return filteredByAccount.map(transaction => {
      const amount = transaction.amount
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration, customCategories) : 'income',
        date: new Date(transaction.date)
      }
    })
  }, [transactions, effectiveAccountId, customCategories])

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    
    return processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      
      switch (timePeriod) {
        case 'day':
          return transactionDate.getDate() === now.getDate() &&
                 transactionDate.getMonth() === now.getMonth() &&
                 transactionDate.getFullYear() === now.getFullYear()
        
        case 'month':
          return transactionDate.getMonth() === now.getMonth() &&
                 transactionDate.getFullYear() === now.getFullYear()
        
        case 'year':
          return transactionDate.getFullYear() === now.getFullYear()
        
        default:
          return true
      }
    })
  }, [processedTransactions, timePeriod])

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense')
    const totalExpense = expenses.reduce((sum, t) => sum + t.numericAmount, 0)
    const categoryMap = new Map()

    expenses.forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || {
        category: transaction.category,
        amount: 0,
        percentage: 0,
        count: 0,
      }

      categoryMap.set(transaction.category, {
        ...existing,
        amount: existing.amount + transaction.numericAmount,
        count: existing.count + 1,
      })
    })

    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        percentage: totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredTransactions])

  const totalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0),
    [filteredTransactions]
  )
  
  const totalExpense = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0),
    [filteredTransactions]
  )
  
  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense])

  const incomeTransactionCount = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'income').length,
    [filteredTransactions]
  )
  
  const expenseTransactionCount = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'expense').length,
    [filteredTransactions]
  )

  const monthlyExpense = useMemo(() => {
    const now = new Date()
    const currentMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === now.getMonth() &&
             transactionDate.getFullYear() === now.getFullYear() &&
             transaction.type === 'expense'
    })
    return currentMonthTransactions.reduce((sum, t) => sum + t.numericAmount, 0)
  }, [processedTransactions])

  const monthOnMonthData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const currentMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear
    })
    
    const prevMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === prevMonth &&
             transactionDate.getFullYear() === prevYear
    })
    
    const currentIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const currentExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const currentDayOfMonth = now.getDate()
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
    
    const currentDailyAvg = currentDayOfMonth > 0 ? currentExpense / currentDayOfMonth : 0
    const prevDailyAvg = daysInPrevMonth > 0 ? prevExpense / daysInPrevMonth : 0
    
    return {
      currentMonth: {
        name: monthNames[currentMonth],
        income: currentIncome,
        expense: currentExpense,
        daysElapsed: currentDayOfMonth,
        dailyAverage: currentDailyAvg
      },
      prevMonth: {
        name: monthNames[prevMonth],
        income: prevIncome,
        expense: prevExpense,
        totalDays: daysInPrevMonth,
        dailyAverage: prevDailyAvg
      }
    }
  }, [processedTransactions])

  const handleOptionsClick = useCallback(() => setShowAccountFilter(true), [])

  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Insights', 'Look into your spending patterns and trends')
  }, [])

  const renderHeader = useCallback(() => (
    <>
      {/* Account Filter Dialog */}
      <Dialog.Root open={showAccountFilter} onOpenChange={setShowAccountFilter}>
        <AccountFilterMenu 
          accounts={accounts} 
          currency={currency} 
          asDialogContent={true}
          open={showAccountFilter}
          onOpenChange={setShowAccountFilter}
        />
      </Dialog.Root>
    </>
  ), [showAccountFilter, accounts, currency, handleOptionsClick])

  const renderStickyContent = useCallback(() => (
    <>
      <Box className={styles.timeRangeContainer}>
        <Tabs.Root value={timePeriod} onValueChange={(value) => setTimePeriod(value as 'day' | 'month' | 'year')}>
          <Tabs.List>
            <Tabs.Trigger value="day">Day</Tabs.Trigger>
            <Tabs.Trigger value="month">Month</Tabs.Trigger>
            <Tabs.Trigger value="year">Year</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </Box>

      {/* Stats Cards */}
      {processedTransactions.length > 0 && (
        <Grid id="stats-cards" className={styles.statsGrid}>
          <StatsCards 
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netBalance={netBalance}
            incomeTransactionCount={incomeTransactionCount}
            expenseTransactionCount={expenseTransactionCount}
            currency={currency}
          />
        </Grid>
      )}
    </>
  ), [timePeriod, setTimePeriod, processedTransactions.length, totalIncome, totalExpense, netBalance, incomeTransactionCount, expenseTransactionCount, currency])

  const renderBodyContent = useCallback(() => (
    <>
      {processedTransactions.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No data to analyze yet"
          description="Add some transactions to see analytics and insights"
        />
      ) : (
        <>
          <Grid id="expense-breakdown">
            <AnalyticsCard
              title="Expense Breakdown"
              description="Visual breakdown of your spending by category"
              showNavigation={categoryData.length > 0}
              onNextChart={handleNextChart}
              onPrevChart={handlePrevChart}
            >
              {categoryData.length === 0 ? (
                <ChartPlaceholder
                  icon="📈"
                  message="No expense data for this period"
                  type="no-data"
                />
              ) : (
                <div className={styles.chartContainer}>
                  <div className={styles.chartWrapper}>
                    {currentChartIndex === 0 && (
                      <PieChart 
                        data={categoryData.slice(0, 9)} 
                        categoryConfig={categoryConfig}
                        currency={currency}
                      />
                    )}
                    {currentChartIndex === 1 && (
                      <TreemapChart 
                        data={categoryData.slice(0, 10)} 
                        categoryConfig={categoryConfig}
                        currency={currency}
                      />
                    )}
                    {currentChartIndex === 2 && (
                      <BubbleChart 
                        data={categoryData.slice(0, 9)} 
                        categoryConfig={categoryConfig}
                        currency={currency}
                      />
                    )}
                    {currentChartIndex === 3 && (
                      <ChartPlaceholder
                        icon="📊"
                        message="More chart types coming soon!"
                        type="coming-soon"
                      />
                    )}
                  </div>
                </div>
              )}
            </AnalyticsCard>
          </Grid>

          <Grid id="daily-comparison">
            <AnalyticsCard
              title="Daily Expense"
              description="Compare daily expenses for the entire month between current and previous month"
            >
              {(monthOnMonthData.currentMonth.expense === 0 && monthOnMonthData.prevMonth.expense === 0) ? (
                <ChartPlaceholder
                  icon="📈"
                  message="No expense data for comparison"
                  type="no-data"
                />
              ) : (
                <div className={styles.chartContainer}>
                  <MonthOnMonthChart 
                    data={monthOnMonthData}
                    currency={currency}
                    transactions={processedTransactions}
                  />
                  <div className={styles.comparisonStats}>
                    <DailySpendingComparison
                      currentMonthAverage={monthOnMonthData.currentMonth.dailyAverage}
                      prevMonthAverage={monthOnMonthData.prevMonth.dailyAverage}
                      currentMonthName={monthOnMonthData.currentMonth.name}
                      prevMonthName={monthOnMonthData.prevMonth.name}
                      currency={currency}
                    />
                  </div>
                </div>
              )}
            </AnalyticsCard>
          </Grid>

          <Grid id="balance-history">
            <AnalyticsCard
              title={`${monthOnMonthData.currentMonth.name} vs ${monthOnMonthData.prevMonth.name}`}
              description="Track your cumulative spending - compare any two months"
            >
              {(monthOnMonthData.currentMonth.expense === 0 && monthOnMonthData.prevMonth.expense === 0) ? (
                <ChartPlaceholder
                  icon="💰"
                  message="No balance data for comparison"
                  type="no-data"
                />
              ) : (
                <div className={styles.chartContainer}>
                  <BalanceHistoryChart 
                    data={monthOnMonthData}
                    currency={currency}
                    transactions={processedTransactions}
                  />
                </div>
              )}
            </AnalyticsCard>
          </Grid>

          <Grid id="spending-category">
            <AnalyticsCard
              title="Spending by Category"
              description="Detailed breakdown of your expenses across different categories"
            >
              <CategoryBreakdown 
                categoryData={categoryData}
                currency={currency}
                customCategories={customCategories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </AnalyticsCard>
          </Grid>

          <Grid id="recurring-payments">
            <AnalyticsCard
              title="Recurring Payments"
              description="Track your recurring expenses and upcoming payment predictions"
            >
              <RecurringPayments 
                transactions={processedTransactions}
                currency={currency}
                maxItems={5}
                showSeeMore={false}
              />
            </AnalyticsCard>
          </Grid>
        </>
      )}
    </>
  ), [
    processedTransactions, 
    categoryData, 
    currentChartIndex, 
    categoryConfig, 
    currency, 
    monthOnMonthData, 
    customCategories,
    handleNextChart,
    handlePrevChart,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory
  ])

  return (
    <PageLayout
      header={renderHeader()}
      stickySection={renderStickyContent()}
      footer={{ buttonColor: '#222222', opacity: 50 }}
    >
      {renderBodyContent()}
    </PageLayout>
  )
}
