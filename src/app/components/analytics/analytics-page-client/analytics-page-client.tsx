'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { redirect, useParams } from 'next/navigation'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Footer from '@/app/components/footer/footer'
import { UserProfile, CategoryData, RecurringPayment } from '../types/analytics-types'
import { categorizeTransaction } from '../utils/categorize-transaction'
import { formatCurrency } from '../utils/format-currency'
import { categoryConfig } from '../config/category-config'
import { PieChart } from '../pie-chart/pie-chart'
import { MonthOnMonthChart } from '../month-on-month-chart/month-on-month-chart'
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
  const customerId = params.customerId as string

  // Handle hydration and localStorage loading
  useEffect(() => {
    setIsHydrated(true)
    
    // Load saved time period from localStorage after hydration
    const savedPeriod = localStorage.getItem('analytics-time-period') as 'day' | 'month' | 'year'
    if (savedPeriod && ['day', 'month', 'year'].includes(savedPeriod)) {
      setTimePeriod(savedPeriod)
    }
  }, [])

  // Save time period to localStorage when it changes
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

  // Filter by time period
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

  // Month-on-month comparison data
  const monthOnMonthData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Calculate previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    // Get current month transactions
    const currentMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear
    })
    
    // Get previous month transactions
    const prevMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === prevMonth &&
             transactionDate.getFullYear() === prevYear
    })
    
    // Calculate totals
    const currentIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const currentExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return {
      currentMonth: {
        name: monthNames[currentMonth],
        income: currentIncome,
        expense: currentExpense
      },
      prevMonth: {
        name: monthNames[prevMonth],
        income: prevIncome,
        expense: prevExpense
      }
    }
  }, [processedTransactions])

  // Detect recurring payments
  const recurringPayments = useMemo(() => {
    const expenseTransactions = processedTransactions.filter(t => t.type === 'expense')
    const patternMap = new Map<string, RecurringPayment['transactions']>()
    
    // Group transactions by similar narration patterns
    expenseTransactions.forEach(transaction => {
      const normalizedNarration = transaction.narration
        .toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim()
      
      if (normalizedNarration.length > 3) { // Only consider meaningful patterns
        if (!patternMap.has(normalizedNarration)) {
          patternMap.set(normalizedNarration, [])
        }
        patternMap.get(normalizedNarration)!.push({
          date: transaction.date,
          amount: transaction.numericAmount,
          narration: transaction.narration
        })
      }
    })
    
    const recurring: RecurringPayment[] = []
    
    // Analyze patterns for recurring behavior
    patternMap.forEach((transactions, pattern) => {
      if (transactions.length >= 2) { // Need at least 2 occurrences
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
        
        // Calculate intervals between transactions
        const intervals: number[] = []
        for (let i = 1; i < transactions.length; i++) {
          const daysDiff = Math.round((transactions[i].date.getTime() - transactions[i-1].date.getTime()) / (1000 * 60 * 60 * 24))
          intervals.push(daysDiff)
        }
        
        // Check if intervals are somewhat consistent (within 7 days variance)
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
        const isRecurring = intervals.every(interval => Math.abs(interval - avgInterval) <= 7)
        
        if (isRecurring && avgInterval >= 7 && avgInterval <= 365) { // Between weekly and yearly
          const lastTransaction = transactions[transactions.length - 1]
          const averageAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
          const category = categorizeTransaction(lastTransaction.narration)
          
          // Predict next payment
          const nextPaymentDate = new Date(lastTransaction.date.getTime() + (avgInterval * 24 * 60 * 60 * 1000))
          
          recurring.push({
            pattern: pattern.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            category,
            averageAmount,
            count: transactions.length,
            intervalDays: Math.round(avgInterval),
            lastPayment: lastTransaction.date,
            nextPayment: nextPaymentDate,
            transactions
          })
        }
      }
    })
    
    // Sort by next payment date (soonest first)
    return recurring.sort((a, b) => a.nextPayment.getTime() - b.nextPayment.getTime())
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
                onClick={() => redirect(`/${customerId}/dashboard`)}
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
              <div className={styles.statsGrid}>
                <div className={styles.statsCard}>
                  <div className={styles.statsCardHeader}>
                    <div className={styles.statsCardTitle}>
                      💰 Total Income
                    </div>
                  </div>
                  <div className={styles.statsCardContent}>
                    <div className={`${styles.statsValue} ${styles.incomeColor}`}>
                      {formatCurrency(totalIncome, profile.currency)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {filteredTransactions.filter(t => t.type === 'income').length} transactions
                    </div>
                  </div>
                </div>

                <div className={styles.statsCard}>
                  <div className={styles.statsCardHeader}>
                    <div className={styles.statsCardTitle}>
                      💸 Total Expenses
                    </div>
                  </div>
                  <div className={styles.statsCardContent}>
                    <div className={`${styles.statsValue} ${styles.expenseColor}`}>
                      {formatCurrency(totalExpense, profile.currency)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {filteredTransactions.filter(t => t.type === 'expense').length} transactions
                    </div>
                  </div>
                </div>

                <div className={styles.statsCard}>
                  <div className={styles.statsCardHeader}>
                    <div className={styles.statsCardTitle}>
                      📊 Net Balance
                    </div>
                  </div>
                  <div className={styles.statsCardContent}>
                    <div className={`${styles.statsValue} ${netBalance >= 0 ? styles.incomeColor : styles.expenseColor}`}>
                      {formatCurrency(netBalance, profile.currency)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {netBalance >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expense Pie Chart */}
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>📊 Expense Breakdown</h2>
                  <p className={styles.cardDescription}>
                    Visual breakdown of your spending by category
                  </p>
                </div>
                <div className={styles.cardContent}>
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
                </div>
              </div>

              {/* Month-on-Month Comparison */}
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>📈 Daily Expense Comparison</h2>
                  <p className={styles.cardDescription}>
                    Compare daily expenses for the entire month between current and previous month
                  </p>
                </div>
                <div className={styles.cardContent}>
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
                        {(() => {
                          const expenseChange = monthOnMonthData.currentMonth.expense - monthOnMonthData.prevMonth.expense
                          const expensePercentChange = monthOnMonthData.prevMonth.expense > 0 ? ((expenseChange / monthOnMonthData.prevMonth.expense) * 100) : 0
                          
                          return (
                            <div className={styles.comparisonStat}>
                              <span className={`${styles.comparisonValue} ${expenseChange >= 0 ? styles.expenseColor : styles.incomeColor}`}>
                                {expenseChange >= 0 ? '+' : ''}{formatCurrency(expenseChange, profile.currency)} ({expensePercentChange >= 0 ? '+' : ''}{expensePercentChange.toFixed(1)}%)
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>🏷️ Spending by Category</h2>
                  <p className={styles.cardDescription}>
                    Detailed breakdown of your expenses across different categories
                  </p>
                </div>
                <div className={styles.cardContent}>
                  {categoryData.length === 0 ? (
                    <div className={styles.noData}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                      No expense data for this period
                    </div>
                  ) : (
                    <div className={styles.categoryList}>
                      {categoryData.slice(0, 6).map((cat, index) => {
                        const config = categoryConfig[cat.category] || categoryConfig.other
                        return (
                          <div key={cat.category} className={styles.categoryItem}>
                            <div className={styles.categoryItemLeft}>
                              <div 
                                className={styles.categoryColor}
                                style={{ backgroundColor: config.color }}
                              />
                              <span className={styles.categoryLabel}>{config.label}</span>
                            </div>
                            <div className={styles.categoryItemRight}>
                              <span className={styles.categoryPercentage}>
                                {cat.percentage.toFixed(1)}%
                              </span>
                              <span className={styles.categoryAmount}>
                                {formatCurrency(cat.amount, profile.currency)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recurring Payments */}
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>🔄 Recurring Payments</h2>
                  <p className={styles.cardDescription}>
                    Track your recurring expenses and upcoming payment predictions
                  </p>
                </div>
                <div className={styles.cardContent}>
                  {recurringPayments.length === 0 ? (
                    <div className={styles.noData}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                      No recurring payments detected
                    </div>
                  ) : (
                    <div className={styles.recurringList}>
                      {recurringPayments.slice(0, 10).map((recurring, index) => (
                        <div key={`${recurring.pattern}-${index}`} className={styles.recurringItem}>
                          <div className={styles.recurringItemLeft}>
                            <div className={styles.recurringIcon}>
                              {recurring.category === 'utilities' ? '⚡' :
                               recurring.category === 'housing' ? '🏠' :
                               recurring.category === 'transport' ? '🚗' :
                               recurring.category === 'entertainment' ? '🎮' : '💳'}
                            </div>
                            <div className={styles.recurringDetails}>
                              <span className={styles.recurringName}>{recurring.pattern}</span>
                              <span className={styles.recurringFrequency}>
                                Every {recurring.intervalDays} days • {recurring.count} payments
                              </span>
                            </div>
                          </div>
                          <div className={styles.recurringItemRight}>
                            <span className={styles.recurringAmount}>
                              {formatCurrency(recurring.averageAmount, profile.currency)}
                            </span>
                            <span className={styles.recurringNext}>
                              Next: {recurring.nextPayment.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Progress */}
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>💰 Monthly Budget Overview</h2>
                  <p className={styles.cardDescription}>
                    Track your progress against your monthly spending budget (current month)
                  </p>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.budgetOverview}>
                    <div className={styles.budgetProgress}>
                      <div className={styles.budgetProgressBar}>
                        <div 
                          className={styles.budgetProgressFill}
                          style={{ 
                            width: `${Math.min((monthlyExpense / profile.monthlyBudget) * 100, 100)}%`,
                            background: monthlyExpense > profile.monthlyBudget 
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                              : 'linear-gradient(90deg, #10b981, #059669)'
                          }}
                        />
                      </div>
                      <div className={styles.budgetLabels}>
                        <span>💸 Spent: {formatCurrency(monthlyExpense, profile.currency)}</span>
                        <span>🎯 Budget: {formatCurrency(profile.monthlyBudget, profile.currency)}</span>
                      </div>
                      <div className={styles.budgetRemaining}>
                        <span className={monthlyExpense <= profile.monthlyBudget ? styles.incomeColor : styles.expenseColor}>
                          {monthlyExpense <= profile.monthlyBudget 
                            ? `🎉 ${formatCurrency(profile.monthlyBudget - monthlyExpense, profile.currency)} remaining`
                            : `⚠️ ${formatCurrency(monthlyExpense - profile.monthlyBudget, profile.currency)} over budget`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}
