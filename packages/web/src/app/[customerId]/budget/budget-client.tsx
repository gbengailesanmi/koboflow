'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudget } from '@/app/api/api-service'
import { useToasts } from '@/store'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PageHeader } from '@/app/components/page-header/page-header'
import { PageLayout } from '@/app/components/page-layout/page-layout'
import type { Transaction } from '@/types/transactions'
import type { CustomCategory } from '@/types/custom-category'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { getCategoryConfig } from '@/app/components/analytics/utils/category-config'
import { BudgetProgress } from '@/app/components/budget-progress'
import type { BudgetPeriod, BudgetPeriodType } from '@/types/budget'
import { Dialog, Button, Flex, Text, Progress, Grid } from '@radix-ui/themes'
import styles from './budget.module.css'
import analyticsStyles from '../analytics/analytics.module.css'

type CategoryBudget = {
  category: string
  limit: number
  customName?: string
}

type BudgetData = {
  totalBudgetLimit: number
  period?: BudgetPeriod
  categories: CategoryBudget[]
}

type BudgetClientProps = {
  customerId: string
  initialBudget: BudgetData
  transactions: Transaction[]
  customCategories: CustomCategory[]
  currency: string
}

export default function BudgetClient({
  customerId,
  initialBudget,
  transactions,
  customCategories,
  currency
}: BudgetClientProps) {
  const router = useRouter()
  
  // ✅ Use UI store for toast notifications
  const { showToast } = useToasts()

  const [budgetData, setBudgetData] = useState<BudgetData>(initialBudget)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isRenamingCategory, setIsRenamingCategory] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [periodType, setPeriodType] = useState<BudgetPeriodType>(initialBudget.period?.type || 'current-month')
  const [startDate, setStartDate] = useState(
    initialBudget.period?.startDate 
      ? new Date(initialBudget.period.startDate).toISOString().split('T')[0] 
      : ''
  )
  const [endDate, setEndDate] = useState(
    initialBudget.period?.endDate 
      ? new Date(initialBudget.period.endDate).toISOString().split('T')[0] 
      : ''
  )
  const [recurringInterval, setRecurringInterval] = useState(
    initialBudget.period?.recurringInterval?.toString() || '1'
  )
  const [recurringUnit, setRecurringUnit] = useState<'days' | 'months' | 'years'>(
    initialBudget.period?.recurringUnit || 'months'
  )

  const categoryConfig = useMemo(() => getCategoryConfig(customCategories), [customCategories])

  const saveBudget = useCallback(async (newBudget: BudgetData) => {
    try {
      setIsSaving(true)
      const result = await updateBudget(
        newBudget.totalBudgetLimit,
        newBudget.categories,
        newBudget.period
      )
      
      if (result.success) {
        showToast('Budget saved successfully', 'success')
        router.refresh()
      } else {
        showToast(result.message || 'Failed to save budget', 'error')
      }
    } catch (error) {
      console.error('Failed to save budget:', error)
      showToast('Failed to save budget. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [router, showToast])

  const processedTransactions = useMemo(() => {
    return transactions.map((transaction) => {
      const amount = parseFloat(transaction.amount)
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration, customCategories) : 'income',
        date: new Date(transaction.bookedDate)
      }
    })
  }, [transactions, customCategories])

  const isDateInPeriod = (date: Date, period?: BudgetPeriod): boolean => {
    if (!period || period.type === 'current-month') {
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }
    
    if (period.type === 'custom-date' && period.startDate && period.endDate) {
      const start = new Date(period.startDate)
      const end = new Date(period.endDate)
      return date >= start && date <= end
    }
    
    if (period.type === 'recurring' && period.startDate && period.recurringInterval && period.recurringUnit) {
      const start = new Date(period.startDate)
      const now = new Date()
      
      let periodsSinceStart = 0
      if (period.recurringUnit === 'days') {
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        periodsSinceStart = Math.floor(daysSinceStart / period.recurringInterval)
      } else if (period.recurringUnit === 'months') {
        const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
        periodsSinceStart = Math.floor(monthsSinceStart / period.recurringInterval)
      } else if (period.recurringUnit === 'years') {
        const yearsSinceStart = now.getFullYear() - start.getFullYear()
        periodsSinceStart = Math.floor(yearsSinceStart / period.recurringInterval)
      }
      
      const currentPeriodStart = new Date(start)
      if (period.recurringUnit === 'days') {
        currentPeriodStart.setDate(start.getDate() + (periodsSinceStart * period.recurringInterval))
      } else if (period.recurringUnit === 'months') {
        currentPeriodStart.setMonth(start.getMonth() + (periodsSinceStart * period.recurringInterval))
      } else if (period.recurringUnit === 'years') {
        currentPeriodStart.setFullYear(start.getFullYear() + (periodsSinceStart * period.recurringInterval))
      }
      
      const currentPeriodEnd = new Date(currentPeriodStart)
      if (period.recurringUnit === 'days') {
        currentPeriodEnd.setDate(currentPeriodStart.getDate() + period.recurringInterval)
      } else if (period.recurringUnit === 'months') {
        currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + period.recurringInterval)
      } else if (period.recurringUnit === 'years') {
        currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + period.recurringInterval)
      }
      
      return date >= currentPeriodStart && date < currentPeriodEnd
    }
    
    return false
  }

  const monthlyExpenses = useMemo(() => {
    return processedTransactions
      .filter((t: any) => t.type === 'expense' && isDateInPeriod(t.date, budgetData.period))
      .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
  }, [processedTransactions, budgetData.period])

  const categoryExpenses = useMemo(() => {
    const categories = Object.keys(categoryConfig).filter(cat => cat !== 'income')
    
    return categories.map(category => {
      const spent = processedTransactions
        .filter((t: any) => {
          return t.type === 'expense' &&
                 t.category === category &&
                 isDateInPeriod(t.date, budgetData.period)
        })
        .reduce((sum: number, t: any) => sum + t.numericAmount, 0)

      const budget = budgetData.categories.find(b => 
        b.category === category && !b.customName
      )
      
      return {
        category,
        spent,
        limit: budget?.limit || 0,
        hasLimit: !!budget,
        customName: undefined as string | undefined
      }
    }).sort((a, b) => b.spent - a.spent)
  }, [processedTransactions, budgetData.categories, budgetData.period, categoryConfig])

  const monthlyProgress = (monthlyExpenses / budgetData.totalBudgetLimit) * 100
  const isOverBudget = monthlyExpenses > budgetData.totalBudgetLimit

  // Calculate total allocated to category budgets
  const totalCategoryBudget = useMemo(() => {
    return budgetData.categories.reduce((sum, cat) => sum + cat.limit, 0)
  }, [budgetData.categories])

  const categoryBudgetProgress = (totalCategoryBudget / budgetData.totalBudgetLimit) * 100
  const isCategoryBudgetOver = totalCategoryBudget > budgetData.totalBudgetLimit

  const formatPeriod = (period?: BudgetPeriod): string => {
    if (!period || period.type === 'current-month') {
      return 'Current Month'
    }
    
    if (period.type === 'custom-date' && period.startDate && period.endDate) {
      const start = new Date(period.startDate).toLocaleDateString()
      const end = new Date(period.endDate).toLocaleDateString()
      return `${start} - ${end}`
    }
    
    if (period.type === 'recurring' && period.recurringInterval && period.recurringUnit) {
      const interval = period.recurringInterval === 1 ? '' : period.recurringInterval
      const unit = period.recurringInterval === 1 
        ? period.recurringUnit.slice(0, -1)
        : period.recurringUnit
      return `Every ${interval} ${unit}`.trim()
    }
    
    return 'Current Month'
  }
  
  const getPeriodText = (period?: BudgetPeriod): string => {
    if (!period || period.type === 'current-month') {
      return 'this month'
    }
    return 'this period'
  }

  const getCategoryDisplayName = (category: string) => {
    const budget = budgetData.categories.find(b => b.category === category)
    if (budget?.customName) {
      return budget.customName
    }
    const config = categoryConfig[category] || categoryConfig.other
    return config?.label || category
  }

  const handleUpdateMonthlyBudget = (newAmount: number) => {
    const newBudget = {
      ...budgetData,
      totalBudgetLimit: newAmount
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsEditing(null)
    setEditValue('')
  }

  const handleUpdateBudgetWithPeriod = () => {
    if (periodType === 'custom-date') {
      if (!startDate || !endDate) {
        alert('Please enter both start and end dates')
        return
      }
      if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date')
        return
      }
    }
    
    if (periodType === 'recurring') {
      if (!startDate) {
        alert('Please enter a start date')
        return
      }
      if (!recurringInterval || parseInt(recurringInterval) < 1) {
        alert('Please enter a valid interval')
        return
      }
    }
    
    const period: BudgetPeriod = { type: periodType }
    
    if (periodType === 'custom-date') {
      period.startDate = new Date(startDate)
      period.endDate = new Date(endDate)
    } else if (periodType === 'recurring') {
      period.startDate = new Date(startDate)
      period.recurringInterval = parseInt(recurringInterval)
      period.recurringUnit = recurringUnit
    }
    
    const amount = parseFloat(editValue)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    const newBudget = {
      ...budgetData,
      totalBudgetLimit: amount,
      period: period
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsEditModalOpen(false)
    setIsEditing(null)
    setEditValue('')
  }

  const handleSetCategoryBudget = (category: string, limit: number, customName?: string) => {
    const otherCategoriesTotal = budgetData.categories
      .filter(b => {
        if (customName) {
          return !(b.category === category && b.customName === customName)
        } else {
          return !(b.category === category && !b.customName)
        }
      })
      .reduce((sum, b) => sum + b.limit, 0)
    
    const newTotal = otherCategoriesTotal + limit
    if (newTotal > budgetData.totalBudgetLimit) {
      const available = budgetData.totalBudgetLimit - otherCategoriesTotal
      alert(
        `Category budget exceeds monthly limit!\n\n` +
        `Monthly Budget: ${formatCurrency(budgetData.totalBudgetLimit, currency)}\n` +
        `Other Categories Total: ${formatCurrency(otherCategoriesTotal, currency)}\n` +
        `Available for this category: ${formatCurrency(available, currency)}\n\n` +
        `You tried to set: ${formatCurrency(limit, currency)}`
      )
      return
    }

    const newBudget = {
      ...budgetData,
      categories: (() => {
        const existing = budgetData.categories.find(b => b.category === category && !b.customName)
        if (existing) {
          return budgetData.categories.map(b => 
            b.category === category && !b.customName ? { ...b, limit, ...(customName ? { customName } : {}) } : b
          )
        }
        return [...budgetData.categories, { 
          category, 
          limit,
          ...(customName ? { customName } : {})
        }]
      })()
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsEditing(null)
    setEditValue('')
    setRenameValue('')
  }

  const handleRemoveCategoryBudget = (category: string) => {
    const newBudget = {
      ...budgetData,
      categories: budgetData.categories.filter(b => b.category !== category)
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
  }

  const startEdit = (type: string, currentValue?: number) => {
    setIsEditing(type)
    setEditValue(currentValue ? currentValue.toString() : '')
  }

  const categoriesWithBudget = categoryExpenses.filter(c => c.hasLimit)
  const categoriesWithoutBudget = categoryExpenses.filter(c => !c.hasLimit)

  const customBudgetCategories = budgetData.categories
    .filter(b => b.customName)
    .map(b => {
      const spent = processedTransactions
        .filter((t: any) => {
          return t.type === 'expense' &&
                 t.category === b.category &&
                 isDateInPeriod(t.date, budgetData.period)
        })
        .reduce((sum: number, t: any) => sum + t.numericAmount, 0)
      
      return {
        category: b.category,
        customName: b.customName,
        spent,
        limit: b.limit,
        hasLimit: true
      }
    })
  
  const allCategoriesWithBudget = [...categoriesWithBudget, ...customBudgetCategories]

  // ============================================================================
  // RENDER - HEADER CONTENT
  // ============================================================================
  const renderHeader = () => (
    <PageHeader 
      title="Budget" 
      subtitle="Set spending limits and track your progress"
    />
  )

  // ============================================================================
  // RENDER - STICKY CONTENT (Budget Card)
  // ============================================================================
  const renderStickyContent = () => (
    <>
      {processedTransactions.length > 0 && (
        <Grid id="budget-overview" style={{ padding: '0 16px', marginTop: '24px' }}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderFlex}>
                <div className={styles.cardTitleSection}>
                  <div className={styles.iconWrapper}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Budget</h2>
                    <p className={styles.cardDescription}>{formatPeriod(budgetData.period)}</p>
                  </div>
                </div>
                <Dialog.Trigger>
                  <button 
                    className={styles.editButton}
                    onClick={() => {
                      setIsEditing('monthly')
                      setEditValue(budgetData.totalBudgetLimit.toString())
                      setIsEditModalOpen(true)
                    }}
                  >
                    ✏️ Edit
                  </button>
                </Dialog.Trigger>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.budgetOverview}>
                <div className={styles.budgetSection}>
                  <div className={styles.budgetLabel}>Spent {getPeriodText(budgetData.period)}</div>
                  <div className={`${styles.budgetValue} ${isOverBudget ? styles.budgetValueOver : styles.budgetValueNormal}`}>
                    {formatCurrency(monthlyExpenses, currency)}
                  </div>
                </div>
                <div className={styles.budgetSection} style={{ alignItems: 'flex-end' }}>
                  <div className={styles.budgetLabel}>Budget limit</div>
                  <div className={`${styles.budgetValue} ${styles.budgetValueMuted}`}>
                    {formatCurrency(budgetData.totalBudgetLimit, currency)}
                  </div>
                </div>
              </div>

              <BudgetProgress
                value={monthlyProgress}
                label="Spending Progress"
                percentage={monthlyProgress}
                color={isOverBudget ? 'red' : monthlyProgress >= 80 ? 'orange' : 'green'}
                size="3"
                className={styles.progressSection}
              />

              <div className={styles.statusAlert}>
                <div className={styles.statusIcon}>
                  {isOverBudget ? '⚠️' : monthlyProgress >= 80 ? '⚡' : '✅'}
                </div>
                <div className={styles.statusContent}>
                  <div className={styles.statusTitle} style={{ 
                    color: isOverBudget ? '#ef4444' : monthlyProgress >= 80 ? '#f59e0b' : '#10b981' 
                  }}>
                    {isOverBudget ? 'Over Budget' : monthlyProgress >= 80 ? 'Approaching Limit' : 'On Track'}
                  </div>
                  <div className={styles.statusMessage}>
                    {isOverBudget 
                      ? `You've exceeded your budget by ${formatCurrency(monthlyExpenses - budgetData.totalBudgetLimit, currency)}`
                      : `You have ${formatCurrency(budgetData.totalBudgetLimit - monthlyExpenses, currency)} remaining ${getPeriodText(budgetData.period)}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid>
      )}
    </>
  )

  // ============================================================================
  // RENDER - BODY CONTENT
  // ============================================================================
  const renderBodyContent = () => (
    <>
      {processedTransactions.length === 0 ? (
        <div className={analyticsStyles.emptyState}>
          <div className={analyticsStyles.emptyStateContent}>
            <div className={analyticsStyles.emptyStateIcon}>💰</div>
            <h3 className={analyticsStyles.emptyStateTitle}>No transactions yet</h3>
            <p className={analyticsStyles.emptyStateText}>
              Add some transactions to start tracking your budget
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Edit Budget Modal */}
          <Grid>
            <Dialog.Content maxWidth="500px">
              <Dialog.Title>Edit Budget</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Update your budget amount and period settings
              </Dialog.Description>

              <Flex direction="column" gap="3">
                {/* Budget Amount */}
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Budget Amount
                  </Text>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Enter budget amount"
                    className={styles.formInput}
                    autoFocus
                  />
                </label>

                {/* Budget Period Type */}
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Budget Period
                  </Text>
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as BudgetPeriodType)}
                    className={styles.formSelect}
                  >
                    <option value="current-month">Current Month</option>
                    <option value="custom-date">Custom Date Range</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </label>

                {/* Custom Date Range */}
                {periodType === 'custom-date' && (
                  <>
                    <label>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Start Date
                      </Text>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={styles.formInput}
                      />
                    </label>
                    <label>
                      <Text as="div" size="2" mb="1" weight="bold">
                        End Date
                      </Text>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={styles.formInput}
                      />
                    </label>
                  </>
                )}

                {/* Recurring Period */}
                {periodType === 'recurring' && (
                  <>
                    <label>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Start Date
                      </Text>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={styles.formInput}
                      />
                    </label>
                    <label>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Repeat Every
                      </Text>
                      <Flex gap="2">
                        <input
                          type="number"
                          value={recurringInterval}
                          onChange={(e) => setRecurringInterval(e.target.value)}
                          placeholder="1"
                          min="1"
                          className={styles.formInput}
                          style={{ flex: 1 }}
                        />
                        <select
                          value={recurringUnit}
                          onChange={(e) => setRecurringUnit(e.target.value as 'days' | 'months' | 'years')}
                          className={styles.formSelect}
                          style={{ flex: 1 }}
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </Flex>
                    </label>
                  </>
                )}
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" disabled={isSaving}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button 
                  onClick={handleUpdateBudgetWithPeriod}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Budget'}
                </Button>
              </Flex>
            </Dialog.Content>
          </Grid>

          {/* Category Budgets */}
          {allCategoriesWithBudget.length > 0 && (
            <Grid id="category-budgets">
                <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Category Budgets</h2>
                  <p className={styles.cardDescription}>Track spending limits for specific categories</p>
                </div>

                {/* Category Budget Allocation Progress */}
                <div className={styles.cardContent} style={{ paddingBottom: '16px' }}>
                  <BudgetProgress
                    value={categoryBudgetProgress}
                    label="Budget Allocation"
                    percentage={categoryBudgetProgress}
                    color={isCategoryBudgetOver ? 'red' : categoryBudgetProgress >= 80 ? 'orange' : 'blue'}
                    size="3"
                    className={styles.progressSection}
                  />

                  {isCategoryBudgetOver && (
                    <div className={styles.statusAlert} style={{ marginTop: '12px' }}>
                      <div className={styles.statusIcon}>⚠️</div>
                      <div className={styles.statusContent}>
                        <div className={styles.statusTitle} style={{ color: '#ef4444' }}>
                          Over-allocated
                        </div>
                        <div className={styles.statusMessage}>
                          Category budgets exceed total budget by {formatCurrency(totalCategoryBudget - budgetData.totalBudgetLimit, currency)}
                        </div>
                      </div>
                    </div>
                  )}
                  {!isCategoryBudgetOver && categoryBudgetProgress >= 80 && (
                    <div className={styles.statusAlert} style={{ marginTop: '12px' }}>
                      <div className={styles.statusIcon}>⚡</div>
                      <div className={styles.statusContent}>
                        <div className={styles.statusTitle} style={{ color: '#f59e0b' }}>
                          Nearly Full
                        </div>
                        <div className={styles.statusMessage}>
                          You have {formatCurrency(budgetData.totalBudgetLimit - totalCategoryBudget, currency)} remaining to allocate
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.categoryGrid}>
                  {allCategoriesWithBudget.map(({ category, spent, limit, customName }) => {
                    const config = categoryConfig[category] || categoryConfig.other
                    const progress = (spent / limit) * 100
                    const isOver = spent > limit
                    const itemKey = customName ? `${category}-${customName}` : category
                  
                    return (
                      <React.Fragment key={itemKey}>
                        <div className={styles.categoryItem}>
                          <div className={styles.categoryHeader}>
                            <div className={styles.categoryLeft}>
                              <div 
                                className={styles.categoryIconWrapper}
                                style={{ backgroundColor: config?.color ? config.color + '20' : '#00000020' }}
                              >
                                <span style={{ fontSize: '20px' }}>
                                  {category === 'food' ? '🍔' :
                                   category === 'transport' ? '🚗' :
                                   category === 'dining' ? '🍽️' :
                                   category === 'shopping' ? '🛍️' :
                                   category === 'utilities' ? '⚡' :
                                   category === 'housing' ? '🏠' :
                                   category === 'healthcare' ? '⚕️' :
                                   category === 'entertainment' ? '🎮' : '💳'}
                                </span>
                              </div>
                              <div className={styles.categoryDetails}>
                                <div className={styles.categoryName}>
                                  {customName || getCategoryDisplayName(category)}
                                </div>
                                <div className={styles.categorySpent}>
                                  {formatCurrency(spent, currency)} of {formatCurrency(limit, currency)}
                                </div>
                              </div>
                            </div>
                            <div className={styles.categoryActions}>
                              <span className={`${styles.badge} ${
                                isOver ? styles.badgeDanger : 
                                progress >= 80 ? styles.badgeWarning : 
                                styles.badgeSecondary
                              }`}>
                                {progress.toFixed(0)}%
                              </span>
                              <button 
                                className={styles.iconButton}
                                onClick={() => startEdit(itemKey, limit)}
                              >
                                ✏️
                              </button>
                              <button 
                                className={styles.iconButton}
                                onClick={() => {
                                  if (customName) {
                                    const newBudget = {
                                      ...budgetData,
                                      categories: budgetData.categories.filter(b => 
                                        !(b.category === category && b.customName === customName)
                                      )
                                    }
                                    setBudgetData(newBudget)
                                    saveBudget(newBudget)
                                  } else {
                                    handleRemoveCategoryBudget(category)
                                  }
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <BudgetProgress 
                            value={progress}
                            label=""
                            percentage={progress}
                            color={isOver ? 'red' : progress >= 80 ? 'orange' : 'green'}
                            size="2"
                            showPercentage={false}
                            style={{ marginTop: '8px' }}
                          />
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </Grid>
          )}

            {/* Add Category Section */}
            <Grid id="add-category">
              <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Add Category Budget</h2>
                  <p className={styles.cardDescription}>Set spending limits for individual expense categories</p>
                </div>
              {categoriesWithoutBudget.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📈</div>
                  <h3 className={styles.emptyStateTitle}>All categories have budgets</h3>
                  <p className={styles.emptyStateText}>You've set budget limits for all expense categories</p>
                </div>
              ) : (
                <div className={styles.addCategorySection}>
                  {categoriesWithoutBudget.map(({ category, spent }) => {
                    const config = categoryConfig[category] || categoryConfig.other

                    return (
                      <React.Fragment key={category}>
                        <div className={styles.addCategoryItem}>
                          <div className={styles.categoryLeft}>
                            <div 
                              className={styles.categoryIconWrapper}
                              style={{ backgroundColor: config?.color ? config.color + '20' : '#00000020' }}
                            >
                              <span style={{ fontSize: '16px' }}>
                                {category === 'food' ? '🍔' :
                                 category === 'transport' ? '🚗' :
                                 category === 'dining' ? '🍽️' :
                                 category === 'shopping' ? '🛍️' :
                                 category === 'utilities' ? '⚡' :
                                 category === 'housing' ? '🏠' :
                                 category === 'healthcare' ? '⚕️' :
                                 category === 'entertainment' ? '🎮' : '💳'}
                              </span>
                            </div>
                            <div className={styles.categoryDetails}>
                              <div className={styles.categoryName}>
                                {category === 'other' ? 'Other' : getCategoryDisplayName(category)}
                              </div>
                              <div className={styles.categorySpent}>
                                {spent > 0 ? `Spent ${formatCurrency(spent, currency)} ${getPeriodText(budgetData.period)}` : `No spending ${getPeriodText(budgetData.period)}`}
                              </div>
                            </div>
                          </div>
                          <button 
                            className={styles.addButton}
                            onClick={() => startEdit(category)}
                          >
                            <span>➕</span>
                            Set Budget
                          </button>
                        </div>
                        {isEditing === category && (
                          <div style={{ padding: '0 12px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Enter budget limit"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  flex: 1
                                }}
                              />
                              <button 
                                className={styles.editButton}
                                onClick={() => {
                                  const amount = parseFloat(editValue)
                                  if (amount > 0) {
                                    handleSetCategoryBudget(category, amount)
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button 
                                className={styles.editButton}
                                onClick={() => {
                                  setIsEditing(null)
                                  setEditValue('')
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
            </div>
          </Grid>
        </>
      )}
    </>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <Sidebar customerId={customerId}>
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <PageLayout
          header={renderHeader()}
          stickySection={renderStickyContent()}
          footer={{ buttonColor: '#222222', opacity: 50 }}
        >
          {renderBodyContent()}
        </PageLayout>
      </Dialog.Root>
    </Sidebar>
  )
}
