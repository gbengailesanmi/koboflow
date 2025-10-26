'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { redirect, useParams } from 'next/navigation'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Footer from '@/app/components/footer/footer'
import { UserProfile, CategoryData } from '../types/analytics-types'
import { categorizeTransaction } from '../utils/categorize-transaction'
import { formatCurrency } from '../utils/format-currency'
import { categoryConfig } from '../config/category-config'
import { PieChart } from '../pie-chart/pie-chart'
import { MonthOnMonthChart } from '../month-on-month-chart/month-on-month-chart'
import { RecurringPayments } from '../recurring-payments/recurring-payments'
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
                  <RecurringPayments 
                    transactions={processedTransactions}
                    currency={profile.currency}
                    maxItems={5}
                    showSeeMore={false}
                  />
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
