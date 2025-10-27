'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useParams, useRouter } from 'next/navigation'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Footer from '@/app/components/footer/footer'
import { UserProfile, CategoryData } from '../types/analytics-types'
import { categorizeTransaction } from '../utils/categorize-transaction'
import { formatCurrency } from '../utils/format-currency'
import { categoryConfig } from '../utils/category-config'
import { PieChart } from '../pie-chart/pie-chart'
import { MonthOnMonthChart } from '../month-on-month-chart/month-on-month-chart'
import { RecurringPayments } from '../recurring-payments/recurring-payments'
import { StatsCards } from '../stats-cards/stats-cards'
import { CategoryBreakdown } from '../category-breakdown/category-breakdown'
import { BudgetOverview } from '../budget-overview/budget-overview'
import { DailySpendingComparison } from '../daily-spending-comparison/daily-spending-comparison'
import { AnalyticsCard } from '../analytics-card/analytics-card'
import styles from './analytics-page-client.module.css'

type AnalyticsPageClientProps = {
  accounts: Account[]
  transactions: Transaction[]
  profile: UserProfile
}

export default function AnalyticsPageClient({ accounts, transactions, profile }: AnalyticsPageClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year'>('month')
  const [isHydrated, setIsHydrated] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  useEffect(() => {
    setIsHydrated(true)
    
    const savedPeriod = localStorage.getItem('analytics-time-period') as 'day' | 'month' | 'year'
    if (savedPeriod && ['day', 'month', 'year'].includes(savedPeriod)) {
      setTimePeriod(savedPeriod)
    }
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('analytics-time-period', timePeriod)
    }
  }, [timePeriod, isHydrated])

  const processedTransactions = useMemo(() => {
    let filteredByAccount = transactions
    
    if (selectedAccountId !== 'all') {
      filteredByAccount = transactions.filter(transaction => 
        transaction.accountUniqueId === selectedAccountId
      )
    }
    
    return filteredByAccount.map(transaction => {
      const amount = parseFloat(transaction.amount)
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration) : 'income',
        date: new Date(transaction.bookedDate)
      }
    })
  }, [transactions, selectedAccountId])

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
    const categoryMap = new Map<string, CategoryData>()

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

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
  const netBalance = totalIncome - totalExpense

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
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Calculate days in each month for fair comparison
    const currentDayOfMonth = now.getDate() // How many days have passed in current month
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate() // Total days in previous month
    
    // Calculate average daily spending
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div>
          
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.backButton}>
              <ArrowLeftIcon
                className={styles.backIcon}
                onClick={() => router.push(`/${customerId}/dashboard`)}
                style={{ color: '#222222' }}
              />
            </div>
            <div className={styles.headerCenter}>
              <h1 className={styles.title}>Analytics</h1>
            </div>
          </div>
          <div className={styles.subtitle}>
            <p className={styles.subtitleText}>Insights into your spending patterns and trends</p>
          </div>

          {/* Account Selector */}
          <div className={styles.accountSelectorContainer}>
            <label htmlFor="account-select" className={styles.accountSelectorLabel}>
              Filter by Account:
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className={styles.accountSelector}
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.uniqueId}>
                  {account.name} — {profile.currency === 'GBP' ? '£' : formatCurrency(0, profile.currency).charAt(0)}{Number(account.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Selector */}
          <div className={styles.timeRangeContainer}>
            <div className={styles.timeRangeTabs}>
              {(['day', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`${styles.timeRangeTab} ${timePeriod === period ? styles.timeRangeTabActive : ''}`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {processedTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
                <div className={styles.emptyStateIcon}>📊</div>
                <h3 className={styles.emptyStateTitle}>No data to analyze yet</h3>
                <p className={styles.emptyStateText}>
                  Add some transactions to see analytics and insights
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <StatsCards 
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                netBalance={netBalance}
                incomeTransactionCount={filteredTransactions.filter(t => t.type === 'income').length}
                expenseTransactionCount={filteredTransactions.filter(t => t.type === 'expense').length}
                currency={profile.currency}
              />

              {/* Expense Pie Chart */}
              <AnalyticsCard
                title="📊 Expense Breakdown"
                description="Visual breakdown of your spending by category"
              >
                {categoryData.length === 0 ? (
                  <div className={styles.noData}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                    No expense data for this period
                  </div>
                ) : (
                  <div className={styles.chartContainer}>
                    <PieChart 
                      data={categoryData.slice(0, 6)} 
                      categoryConfig={categoryConfig}
                      currency={profile.currency}
                    />
                  </div>
                )}
              </AnalyticsCard>

              {/* Month-on-Month Comparison */}
              <AnalyticsCard
                title="📈 Daily Expense Comparison"
                description="Compare daily expenses for the entire month between current and previous month"
              >
                {(monthOnMonthData.currentMonth.expense === 0 && monthOnMonthData.prevMonth.expense === 0) ? (
                  <div className={styles.noData}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                    No expense data for comparison
                  </div>
                ) : (
                  <div className={styles.chartContainer}>
                    <MonthOnMonthChart 
                      data={monthOnMonthData}
                      currency={profile.currency}
                      transactions={processedTransactions}
                    />
                    <div className={styles.comparisonStats}>
                      <DailySpendingComparison
                        currentMonthAverage={monthOnMonthData.currentMonth.dailyAverage}
                        prevMonthAverage={monthOnMonthData.prevMonth.dailyAverage}
                        currentMonthName={monthOnMonthData.currentMonth.name}
                        prevMonthName={monthOnMonthData.prevMonth.name}
                        currency={profile.currency}
                      />
                    </div>
                  </div>
                )}
              </AnalyticsCard>

              {/* Category Breakdown */}
              <AnalyticsCard
                title="🏷️ Spending by Category"
                description="Detailed breakdown of your expenses across different categories"
              >
                <CategoryBreakdown 
                  categoryData={categoryData}
                  currency={profile.currency}
                />
              </AnalyticsCard>

              {/* Recurring Payments */}
              <AnalyticsCard
                title="🔄 Recurring Payments"
                description="Track your recurring expenses and upcoming payment predictions"
              >
                <RecurringPayments 
                  transactions={processedTransactions}
                  currency={profile.currency}
                  maxItems={5}
                  showSeeMore={false}
                />
              </AnalyticsCard>

              {/* Budget Progress */}
              <AnalyticsCard
                title="💰 Monthly Budget Overview"
                description="Track your progress against your monthly spending budget (current month)"
              >
                <BudgetOverview
                  monthlyExpense={monthlyExpense}
                  monthlyBudget={profile.monthlyBudget}
                  currency={profile.currency}
                />
              </AnalyticsCard>
            </>
          )}
        </div>
      </div>
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}
