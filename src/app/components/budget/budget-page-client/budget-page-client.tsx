'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Transaction } from '@/types/transactions'
import type { CustomCategory } from '@/types/custom-category'
import Footer from '@/app/components/footer/footer'
import { PageHeader } from '@/app/components/page-header/page-header'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { getCategoryConfig } from '@/app/components/analytics/utils/category-config'
import type { BudgetPeriod, BudgetPeriodType } from '@/types/budget'
import { useBaseColor } from '@/providers/base-colour-provider'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import styles from './budget-page-client.module.css'

type UserProfile = {
  name: string
  email: string
  currency: string
  monthlyBudget: number
}

type CategoryBudget = {
  category: string
  limit: number
  customName?: string // Custom name for categories (max 30 chars)
}

type BudgetData = {
  monthly: number
  period?: BudgetPeriod
  categories: CategoryBudget[]
}

type BudgetClientProps = {
  transactions: Transaction[]
  profile: UserProfile
  customCategories: CustomCategory[]
}

export default function BudgetClient({ transactions, profile, customCategories }: BudgetClientProps) {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const { setBaseColor } = useBaseColor()

  // Set static green color for budget page
  useEffect(() => {
    setBaseColor(PAGE_COLORS.budget)
  }, [setBaseColor])

  // Get category config including custom categories
  const categoryConfig = useMemo(() => getCategoryConfig(customCategories), [customCategories])

  // Load budget data from database
  const [budgetData, setBudgetData] = useState<BudgetData>({
    monthly: profile.monthlyBudget || 0,
    period: { type: 'current-month' },
    categories: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isRenamingCategory, setIsRenamingCategory] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  
  // Period editing states
  const [isEditingPeriod, setIsEditingPeriod] = useState(false)
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('current-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [recurringInterval, setRecurringInterval] = useState('1')
  const [recurringUnit, setRecurringUnit] = useState<'days' | 'months' | 'years'>('months')

  // Fetch budget data from database
  React.useEffect(() => {
    async function fetchBudget() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/budget')
        if (response.ok) {
          const data = await response.json()
          const period = data.period || { type: 'current-month' }
          setBudgetData({
            monthly: data.monthly || profile.monthlyBudget || 0,
            period: period,
            categories: data.categories || []
          })
          // Set period editing states
          setPeriodType(period.type)
          if (period.startDate) setStartDate(new Date(period.startDate).toISOString().split('T')[0])
          if (period.endDate) setEndDate(new Date(period.endDate).toISOString().split('T')[0])
          if (period.recurringInterval) setRecurringInterval(period.recurringInterval.toString())
          if (period.recurringUnit) setRecurringUnit(period.recurringUnit)
        }
      } catch (error) {
        console.error('Failed to fetch budget:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBudget()
  }, [profile.monthlyBudget])

  // Save budget data to database
  const saveBudget = React.useCallback(async (newBudget: BudgetData) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save budget')
      }
    } catch (error) {
      console.error('Failed to save budget:', error)
      alert('Failed to save budget. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Process transactions
  const processedTransactions = useMemo(() => {
    return transactions.map(transaction => {
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

  // Helper function to check if a date is within the budget period
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
      
      // Calculate how many periods have passed since start
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
      
      // Calculate current period start and end
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

  // Calculate expenses for the selected period
  const monthlyExpenses = useMemo(() => {
    return processedTransactions
      .filter(t => t.type === 'expense' && isDateInPeriod(t.date, budgetData.period))
      .reduce((sum, t) => sum + t.numericAmount, 0)
  }, [processedTransactions, budgetData.period])

  // Calculate category expenses
  const categoryExpenses = useMemo(() => {
    const categories = Object.keys(categoryConfig).filter(cat => cat !== 'income')
    
    return categories.map(category => {
      const spent = processedTransactions
        .filter(t => {
          return t.type === 'expense' &&
                 t.category === category &&
                 isDateInPeriod(t.date, budgetData.period)
        })
        .reduce((sum, t) => sum + t.numericAmount, 0)

      // For "other" category, only count it as having a limit if there's NO customName
      // (customName ones are treated as separate custom categories)
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
  }, [processedTransactions, budgetData.categories, budgetData.period])

  const monthlyProgress = (monthlyExpenses / budgetData.monthly) * 100
  const isOverBudget = monthlyExpenses > budgetData.monthly

  const handleUpdateMonthlyBudget = (newAmount: number) => {
    const newBudget = {
      ...budgetData,
      monthly: newAmount
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsEditing(null)
    setEditValue('')
  }
  
  const handleUpdateBudgetWithPeriod = () => {
    // Validate inputs based on period type
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
    
    // Build period object
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
      monthly: amount,
      period: period
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsEditingPeriod(false)
    setIsEditing(null)
    setEditValue('')
  }
  
  // Format period for display
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
        ? period.recurringUnit.slice(0, -1) // Remove 's' for singular
        : period.recurringUnit
      return `Every ${interval} ${unit}`.trim()
    }
    
    return 'Current Month'
  }
  
  // Get period text for messages (e.g., "this month" or "this period")
  const getPeriodText = (period?: BudgetPeriod): string => {
    if (!period || period.type === 'current-month') {
      return 'this month'
    }
    return 'this period'
  }
  
  // Get the current active period date range (for recurring budgets)
  const getCurrentPeriodRange = (period?: BudgetPeriod): string => {
    if (!period || period.type === 'current-month') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return `${monthStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${monthEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    if (period.type === 'custom-date' && period.startDate && period.endDate) {
      const start = new Date(period.startDate)
      const end = new Date(period.endDate)
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    if (period.type === 'recurring' && period.startDate && period.recurringInterval && period.recurringUnit) {
      const start = new Date(period.startDate)
      const now = new Date()
      
      // Calculate how many periods have passed since start
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
      
      // Calculate current period start
      const currentPeriodStart = new Date(start)
      if (period.recurringUnit === 'days') {
        currentPeriodStart.setDate(start.getDate() + (periodsSinceStart * period.recurringInterval))
      } else if (period.recurringUnit === 'months') {
        currentPeriodStart.setMonth(start.getMonth() + (periodsSinceStart * period.recurringInterval))
      } else if (period.recurringUnit === 'years') {
        currentPeriodStart.setFullYear(start.getFullYear() + (periodsSinceStart * period.recurringInterval))
      }
      
      // Calculate current period end
      const currentPeriodEnd = new Date(currentPeriodStart)
      if (period.recurringUnit === 'days') {
        currentPeriodEnd.setDate(currentPeriodStart.getDate() + period.recurringInterval - 1)
      } else if (period.recurringUnit === 'months') {
        currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + period.recurringInterval)
        currentPeriodEnd.setDate(0) // Last day of previous month
      } else if (period.recurringUnit === 'years') {
        currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + period.recurringInterval)
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() - 1)
      }
      
      return `${currentPeriodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentPeriodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    return ''
  }

  const handleSetCategoryBudget = (category: string, limit: number, customName?: string) => {
    // Calculate total of all other categories
    const otherCategoriesTotal = budgetData.categories
      .filter(b => {
        // Exclude the category being updated (if it exists)
        if (customName) {
          // For custom categories, exclude by both category and customName
          return !(b.category === category && b.customName === customName)
        } else {
          // For standard categories, exclude by category without customName
          return !(b.category === category && !b.customName)
        }
      })
      .reduce((sum, b) => sum + b.limit, 0)
    
    // Check if new total would exceed monthly budget
    const newTotal = otherCategoriesTotal + limit
    if (newTotal > budgetData.monthly) {
      const available = budgetData.monthly - otherCategoriesTotal
      alert(
        `Category budget exceeds monthly limit!\n\n` +
        `Monthly Budget: ${formatCurrency(budgetData.monthly, profile.currency)}\n` +
        `Other Categories Total: ${formatCurrency(otherCategoriesTotal, profile.currency)}\n` +
        `Available for this category: ${formatCurrency(available, profile.currency)}\n\n` +
        `You tried to set: ${formatCurrency(limit, profile.currency)}`
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

  const handleRenameCategory = (category: string, customName: string) => {
    // Validate custom name (max 30 characters)
    const trimmedName = customName.trim()
    if (trimmedName.length === 0 || trimmedName.length > 30) {
      alert('Category name must be between 1 and 30 characters')
      return
    }

    const newBudget = {
      ...budgetData,
      categories: budgetData.categories.map(b =>
        b.category === category ? { ...b, customName: trimmedName } : b
      )
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
    setIsRenamingCategory(null)
    setRenameValue('')
  }

  const startRename = (category: string, currentName?: string) => {
    setIsRenamingCategory(category)
    setRenameValue(currentName || '')
  }

  const startEdit = (type: string, currentValue?: number) => {
    setIsEditing(type)
    setEditValue(currentValue ? currentValue.toString() : '')
  }

  // Get display name for a category (custom name or default label)
  const getCategoryDisplayName = (category: string) => {
    const budget = budgetData.categories.find(b => b.category === category)
    if (budget?.customName) {
      return budget.customName
    }
    const config = categoryConfig[category] || categoryConfig.other
    return config.label
  }

  const categoriesWithBudget = categoryExpenses.filter(c => c.hasLimit)
  const categoriesWithoutBudget = categoryExpenses.filter(c => !c.hasLimit)
  
  // Add custom budget categories (those with customName) to the budgets list
  const customBudgetCategories = budgetData.categories
    .filter(b => b.customName)
    .map(b => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Calculate spent for this custom category (uses "other" transactions)
      const spent = processedTransactions
        .filter(t => {
          const date = t.date
          return t.type === 'expense' &&
                 t.category === b.category &&
                 date.getMonth() === currentMonth &&
                 date.getFullYear() === currentYear
        })
        .reduce((sum, t) => sum + t.numericAmount, 0)
      
      return {
        category: b.category,
        customName: b.customName,
        spent,
        limit: b.limit,
        hasLimit: true
      }
    })
  
  const allCategoriesWithBudget = [...categoriesWithBudget, ...customBudgetCategories]

  return (
    <div className={`${styles.container} page-gradient-background`}>
      <div className={styles.wrapper}>
        <div>
          {/* Header */}
          <PageHeader 
            title="Budget" 
            subtitle="Set spending limits and track your progress"
          />

          {/* Monthly Budget Card */}
          <div id="monthly-budget" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderFlex}>
                <div className={styles.cardTitleSection}>
                  <div className={styles.iconWrapper}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Budget</h2>
                    <p className={styles.cardDescription}>
                      {formatPeriod(budgetData.period)}
                      {budgetData.period?.type === 'recurring' && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          Current: {getCurrentPeriodRange(budgetData.period)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {!isEditing ? (
                  <button 
                    className={styles.editButton}
                    onClick={() => {
                      setIsEditing('monthly')
                      setIsEditingPeriod(true)
                      setEditValue(budgetData.monthly.toString())
                    }}
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
                    {/* Amount Input */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Budget Amount
                      </label>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter amount"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          width: '100%'
                        }}
                      />
                    </div>
                    
                    {/* Period Type Selector */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Budget Period
                      </label>
                      <select
                        value={periodType}
                        onChange={(e) => setPeriodType(e.target.value as BudgetPeriodType)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          width: '100%'
                        }}
                      >
                        <option value="current-month">Current Month</option>
                        <option value="custom-date">Custom Date Range</option>
                        <option value="recurring">Recurring Period</option>
                      </select>
                    </div>
                    
                    {/* Custom Date Inputs */}
                    {periodType === 'custom-date' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              width: '100%'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              width: '100%'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Recurring Period Inputs */}
                    {periodType === 'recurring' && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              width: '100%'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                              Every
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={recurringInterval}
                              onChange={(e) => setRecurringInterval(e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                width: '100%'
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                              Unit
                            </label>
                            <select
                              value={recurringUnit}
                              onChange={(e) => setRecurringUnit(e.target.value as 'days' | 'months' | 'years')}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                width: '100%'
                              }}
                            >
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className={styles.editButton}
                        onClick={handleUpdateBudgetWithPeriod}
                        style={{ background: '#10b981' }}
                      >
                        ✓ Save
                      </button>
                      <button 
                        className={styles.editButton}
                        onClick={() => {
                          setIsEditing(null)
                          setIsEditingPeriod(false)
                          setEditValue('')
                        }}
                        style={{ background: '#ef4444' }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.budgetOverview}>
                <div className={styles.budgetSection}>
                  <div className={styles.budgetLabel}>Spent {getPeriodText(budgetData.period)}</div>
                  <div className={`${styles.budgetValue} ${isOverBudget ? styles.budgetValueOver : styles.budgetValueNormal}`}>
                    {formatCurrency(monthlyExpenses, profile.currency)}
                  </div>
                </div>
                <div className={styles.budgetSection} style={{ alignItems: 'flex-end' }}>
                  <div className={styles.budgetLabel}>Budget limit</div>
                  <div className={`${styles.budgetValue} ${styles.budgetValueMuted}`}>
                    {formatCurrency(budgetData.monthly, profile.currency)}
                  </div>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressLabel}>
                  <span className={styles.progressLabelText}>Spending Progress</span>
                  <span className={`${styles.progressPercentage} ${isOverBudget ? styles.budgetValueOver : ''}`}>
                    {monthlyProgress.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${Math.min(monthlyProgress, 100)}%`,
                      background: isOverBudget 
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                        : 'linear-gradient(90deg, #10b981, #059669)'
                    }}
                  />
                </div>
              </div>

              {/* Budget Allocation Progress */}
              {(() => {
                const totalAllocated = budgetData.categories.reduce((sum, b) => sum + b.limit, 0)
                const remaining = budgetData.monthly - totalAllocated
                const allocationPercentage = (totalAllocated / budgetData.monthly) * 100
                const isOverAllocated = totalAllocated > budgetData.monthly

                return totalAllocated > 0 ? (
                  <div style={{ marginTop: '16px' }}>
                    <div className={styles.budgetOverview}>
                      <div className={styles.budgetSection}>
                        <div className={styles.budgetLabel}>Allocated to categories</div>
                        <div className={`${styles.budgetValue} ${isOverAllocated ? styles.budgetValueOver : styles.budgetValueNormal}`}>
                          {formatCurrency(totalAllocated, profile.currency)}
                        </div>
                      </div>
                      <div className={styles.budgetSection} style={{ alignItems: 'flex-end' }}>
                        <div className={styles.budgetLabel}>
                          {isOverAllocated ? 'Over-allocated' : 'Unallocated'}
                        </div>
                        <div className={`${styles.budgetValue} ${isOverAllocated ? styles.budgetValueOver : styles.budgetValueNormal}`}>
                          {formatCurrency(Math.abs(remaining), profile.currency)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.progressSection}>
                      <div className={styles.progressLabel}>
                        <span className={styles.progressLabelText}>Budget Allocation</span>
                        <span className={`${styles.progressPercentage} ${isOverAllocated ? styles.budgetValueOver : ''}`}>
                          {allocationPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${Math.min(allocationPercentage, 100)}%`,
                            background: isOverAllocated 
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                              : allocationPercentage >= 90
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : 'linear-gradient(90deg, #10b981, #059669)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

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
                      ? `You've exceeded your budget by ${formatCurrency(monthlyExpenses - budgetData.monthly, profile.currency)}`
                      : `You have ${formatCurrency(budgetData.monthly - monthlyExpenses, profile.currency)} remaining ${getPeriodText(budgetData.period)}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories with Budget */}
          {allCategoriesWithBudget.length > 0 && (
            <div id="category-budgets" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Category Budgets</h2>
                <p className={styles.cardDescription}>
                  Track spending limits for specific categories
                </p>
              </div>
              <div className={styles.categoryGrid}>
                {allCategoriesWithBudget.map(({ category, spent, limit, customName }) => {
                  const config = categoryConfig[category] || categoryConfig.other
                  const progress = (spent / limit) * 100
                  const isOver = spent > limit
                  const isNearLimit = progress >= 80 && !isOver
                  
                  // Create a unique key for custom categories
                  const itemKey = customName ? `${category}-${customName}` : category

                  return (
                    <div key={itemKey} className={styles.categoryItem}>
                      <div className={styles.categoryHeader}>
                        <div className={styles.categoryLeft}>
                          <div 
                            className={styles.categoryIconWrapper}
                            style={{ backgroundColor: config.color + '20' }}
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
                              {category === 'other' && customName && (
                                <button
                                  className={styles.renameButton}
                                  onClick={() => {
                                    startRename(itemKey, customName)
                                  }}
                                  title="Rename category"
                                  style={{
                                    marginLeft: '8px',
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    background: 'transparent',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                            <div className={styles.categorySpent}>
                              {formatCurrency(spent, profile.currency)} of {formatCurrency(limit, profile.currency)}
                            </div>
                          </div>
                        </div>
                        <div className={styles.categoryActions}>
                          <span className={`${styles.badge} ${
                            isOver ? styles.badgeDanger : 
                            isNearLimit ? styles.badgeWarning : 
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
                                // Remove custom category
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
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${Math.min(progress, 100)}%`,
                            background: isOver 
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                              : isNearLimit
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : 'linear-gradient(90deg, #10b981, #059669)'
                          }}
                        />
                      </div>
                      {isEditing === itemKey && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Enter limit"
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
                                // Calculate total of all other categories
                                const otherCategoriesTotal = budgetData.categories
                                  .filter(b => {
                                    if (customName) {
                                      // Exclude current custom category being edited
                                      return !(b.category === category && b.customName === customName)
                                    } else {
                                      // Exclude current standard category being edited
                                      return !(b.category === category && !b.customName)
                                    }
                                  })
                                  .reduce((sum, b) => sum + b.limit, 0)
                                
                                // Check if new total would exceed monthly budget
                                const newTotal = otherCategoriesTotal + amount
                                if (newTotal > budgetData.monthly) {
                                  const available = budgetData.monthly - otherCategoriesTotal
                                  alert(
                                    `Category budget exceeds monthly limit!\n\n` +
                                    `Monthly Budget: ${formatCurrency(budgetData.monthly, profile.currency)}\n` +
                                    `Other Categories Total: ${formatCurrency(otherCategoriesTotal, profile.currency)}\n` +
                                    `Available for this category: ${formatCurrency(available, profile.currency)}\n\n` +
                                    `You tried to set: ${formatCurrency(amount, profile.currency)}`
                                  )
                                  return
                                }

                                if (customName) {
                                  // Update custom category
                                  const newBudget = {
                                    ...budgetData,
                                    categories: budgetData.categories.map(b =>
                                      b.category === category && b.customName === customName
                                        ? { ...b, limit: amount }
                                        : b
                                    )
                                  }
                                  setBudgetData(newBudget)
                                  saveBudget(newBudget)
                                  setIsEditing(null)
                                  setEditValue('')
                                } else {
                                  handleSetCategoryBudget(category, amount)
                                }
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
                      )}
                      {isRenamingCategory === itemKey && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter category name (max 30 chars)"
                            maxLength={30}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              flex: 1
                            }}
                          />
                          <span style={{ 
                            padding: '8px 12px',
                            color: renameValue.length > 30 ? '#ef4444' : '#6b7280',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {renameValue.length}/30
                          </span>
                          <button 
                            className={styles.editButton}
                            onClick={() => {
                              const trimmedName = renameValue.trim()
                              if (trimmedName.length > 0 && trimmedName.length <= 30) {
                                // Update custom category name
                                const newBudget = {
                                  ...budgetData,
                                  categories: budgetData.categories.map(b =>
                                    b.category === category && b.customName === customName
                                      ? { ...b, customName: trimmedName }
                                      : b
                                  )
                                }
                                setBudgetData(newBudget)
                                saveBudget(newBudget)
                                setIsRenamingCategory(null)
                                setRenameValue('')
                              } else {
                                alert('Category name must be between 1 and 30 characters')
                              }
                            }}
                            disabled={renameValue.trim().length === 0 || renameValue.length > 30}
                          >
                            Save
                          </button>
                          <button 
                            className={styles.editButton}
                            onClick={() => {
                              setIsRenamingCategory(null)
                              setRenameValue('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add Category Budget */}
          <div id="add-category" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Add Category Budget</h2>
              <p className={styles.cardDescription}>
                Set spending limits for individual expense categories
              </p>
            </div>
            {categoriesWithoutBudget.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📈</div>
                <h3 className={styles.emptyStateTitle}>All categories have budgets</h3>
                <p className={styles.emptyStateText}>
                  You've set budget limits for all expense categories
                </p>
              </div>
            ) : (
              <div className={styles.addCategorySection}>
                {categoriesWithoutBudget.map(({ category, spent }) => {
                  const config = categoryConfig[category] || categoryConfig.other

                  return (
                    <div key={category}>
                      <div className={styles.addCategoryItem}>
                        <div className={styles.categoryLeft}>
                          <div 
                            className={styles.categoryIconWrapper}
                            style={{ backgroundColor: config.color + '20' }}
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
                              {spent > 0 ? `Spent ${formatCurrency(spent, profile.currency)} ${getPeriodText(budgetData.period)}` : `No spending ${getPeriodText(budgetData.period)}`}
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
                          {category === 'other' && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder="Custom name (optional, max 30 chars)"
                                maxLength={30}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  flex: 1
                                }}
                              />
                              <span style={{ 
                                padding: '8px 12px',
                                color: renameValue.length > 30 ? '#ef4444' : '#6b7280',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: '50px'
                              }}>
                                {renameValue.length}/30
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginTop: category === 'other' ? '0' : '8px' }}>
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
                                  // For "other" category, include custom name if provided
                                  if (category === 'other' && renameValue.trim().length > 0 && renameValue.length <= 30) {
                                    handleSetCategoryBudget(category, amount, renameValue.trim())
                                  } else {
                                    handleSetCategoryBudget(category, amount)
                                  }
                                }
                              }}
                              disabled={category === 'other' && renameValue.length > 30}
                            >
                              Save
                            </button>
                            <button 
                              className={styles.editButton}
                              onClick={() => {
                                setIsEditing(null)
                                setEditValue('')
                                setRenameValue('')
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer buttonColor='#222222' opacity={50} />
    </div>
  )
}
