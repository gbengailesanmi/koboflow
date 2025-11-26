'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@radix-ui/themes'
import { useSelectedItems, useToasts } from '@/store'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import type { CustomCategory } from '@/types/custom-category'
import { createCustomCategory, deleteCustomCategory } from '@/app/api/api-client'
import PageLayoutWithSidebar from '@/app/components/sidebar/sidebar'
import { PageHeader } from '@/app/components/page-header/page-header'
import AccountFilterMenu from '@/app/components/account-filter-menu/account-filter-menu'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import Footer from '@/app/components/footer/footer'
import { useBaseColor } from '@/providers/base-colour-provider'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { getCategoryConfig } from '@/app/components/analytics/utils/category-config'
import { PieChart } from '@/app/components/analytics/pie-chart/pie-chart'
import { MonthOnMonthChart } from '@/app/components/analytics/month-on-month-chart/month-on-month-chart'
import { RecurringPayments } from '@/app/components/analytics/recurring-payments/recurring-payments'
import { StatsCards } from '@/app/components/analytics/stats-cards/stats-cards'
import { CategoryBreakdown } from '@/app/components/analytics/category-breakdown/category-breakdown'
import { BudgetOverview } from '@/app/components/analytics/budget-overview/budget-overview'
import { DailySpendingComparison } from '@/app/components/analytics/daily-spending-comparison/daily-spending-comparison'
import { AnalyticsCard } from '@/app/components/analytics/analytics-card/analytics-card'
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
  transactions: Transaction[]
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
  const { setBaseColor } = useBaseColor()
  
  const { selectedAccountId, setSelectedAccount } = useSelectedItems()
  
  const { showToast } = useToasts()

  const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year'>('month')
  const [showAccountFilter, setShowAccountFilter] = useState(false)
  
  const effectiveAccountId = selectedAccountId || 'all'

  const categoryConfig = useMemo(() => getCategoryConfig(customCategories), [customCategories])

  useEffect(() => {
    const colorWithTransparency = `${PAGE_COLORS.analytics}4D`
    setBaseColor(colorWithTransparency)
  }, [setBaseColor])

  const handleAddCategory = async (name: string, keywords: string[]) => {
    try {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      await createCustomCategory({ 
        name, 
        keywords, 
        color: randomColor 
      })
      
      showToast('Category added successfully', 'success')
      router.refresh()
    } catch (error) {
      console.error('Failed to add category:', error)
      showToast('Failed to add category', 'error')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCustomCategory(id)
      
      showToast('Category deleted successfully', 'success')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete category:', error)
      showToast('Failed to delete category', 'error')
    }
  }

  const processedTransactions = useMemo(() => {
    let filteredByAccount = transactions
    
    if (effectiveAccountId !== 'all') {
      filteredByAccount = transactions.filter(transaction => 
        transaction.accountUniqueId === effectiveAccountId
      )
    }
    
    return filteredByAccount.map(transaction => {
      const amount = parseFloat(transaction.amount)
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration, customCategories) : 'income',
        date: new Date(transaction.bookedDate)
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

  // ============================================================================
  // RENDER - HEADER SECTION
  // ============================================================================
  const renderHeaderSection = () => (
    <div className={styles.headerSection}>
      <PageHeader 
        title="Insights"
        subtitle="Look into your spending patterns and trends"
        showOptionsIcon={true}
        onOptionsClick={() => setShowAccountFilter(true)}
      />

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
            incomeTransactionCount={filteredTransactions.filter(t => t.type === 'income').length}
            expenseTransactionCount={filteredTransactions.filter(t => t.type === 'expense').length}
            currency={currency}
          />
        </Grid>
      )}
    </div>
  )

  // ============================================================================
  // RENDER - BODY SECTION
  // ============================================================================
  const renderBodySection = () => (
    <main className={styles.main}>
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
          <Grid id="expense-breakdown" className={styles.analyticsCard}>
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
                        currency={currency}
                      />
                    </div>
                  )}
                </AnalyticsCard>
              </Grid>

              <Grid id="daily-comparison" className={styles.analyticsCard}>
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

              <Grid id="spending-category" className={styles.analyticsCard}>
                <AnalyticsCard
                  title="🏷️ Spending by Category"
                  description="Detailed breakdown of your expenses across different categories"
                >
                  <CategoryBreakdown 
                    categoryData={categoryData}
                    currency={currency}
                    customCategories={customCategories}
                    onAddCategory={handleAddCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </AnalyticsCard>
              </Grid>

              <Grid id="recurring-payments" className={styles.analyticsCard}>
                <AnalyticsCard
                  title="🔄 Recurring Payments"
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

              <Grid id="budget-overview" className={styles.analyticsCard}>
                <AnalyticsCard
                  title="💰 Monthly Budget Overview"
                  description="Track your progress against your monthly spending budget (current month)"
                >
                  <BudgetOverview
                    monthlyExpense={monthlyExpense}
                    totalBudgetLimit={totalBudgetLimit}
                    currency={currency}
                  />
                </AnalyticsCard>
              </Grid>
            </>
          )}
        </main>
  )

  // ============================================================================
  // RENDER - FOOTER SECTION
  // ============================================================================
  const renderFooterSection = () => (
    <Footer buttonColor='#222222' opacity={50} />
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <PageLayoutWithSidebar customerId={customerId}>
      <div className={`${styles.container} page-gradient-background`}>
        {renderHeaderSection()}
        {renderBodySection()}
      </div>
      {renderFooterSection()}
    </PageLayoutWithSidebar>
  )
}
