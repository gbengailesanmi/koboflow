'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSession, getTransactions, getCategories, getBudget, getSettings, createBudget } from '@/lib/api-service'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { BudgetSkeleton } from '@/app/components/skeletons/budget-skeleton'
import Footer from '@/app/components/footer/footer'
import { PageHeader } from '@/app/components/page-header/page-header'
import type { Transaction } from '@/types/transactions'
import type { CustomCategory } from '@/types/custom-category'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { getCategoryConfig } from '@/app/components/analytics/utils/category-config'
import type { BudgetPeriod, BudgetPeriodType } from '@/types/budget'
import { useBaseColor } from '@/providers/base-colour-provider'
import styles from './budget.module.css'

type UserProfile = {
  firstName: string
  lastName: string
  email: string
  currency: string
  totalBudgetLimit: number
}

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

export default function BudgetPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const { setBaseColor } = useBaseColor()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  // Budget state
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudgetLimit: 0,
    period: { type: 'current-month' },
    categories: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isRenamingCategory, setIsRenamingCategory] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  
  const [isEditingPeriod, setIsEditingPeriod] = useState(false)
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('current-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [recurringInterval, setRecurringInterval] = useState('1')
  const [recurringUnit, setRecurringUnit] = useState<'days' | 'months' | 'years'>('months')

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes: any = await getSession()
        if (!sessionRes || sessionRes.customerId !== customerId) {
          router.push('/login')
          return
        }

        const [transactionsRes, categoriesRes, budgetRes, settingsRes]: any[] = await Promise.all([
          getTransactions(),
          getCategories(),
          getBudget(),
          getSettings(),
        ])

        setData({
          transactions: transactionsRes.transactions || [],
          customCategories: categoriesRes || [],
          budget: budgetRes || null,
          settings: settingsRes.settings || {},
          profile: {
            customerId: sessionRes.customerId,
            email: sessionRes.email,
            firstName: sessionRes.firstName,
            lastName: sessionRes.lastName,
            currency: sessionRes.currency,
          },
        })
        
        const period = budgetRes.period || { type: 'current-month' }
        setBudgetData({
          totalBudgetLimit: budgetRes.totalBudgetLimit || 0,
          period: period,
          categories: budgetRes.categories || []
        })
        setPeriodType(period.type)
        if (period.startDate) setStartDate(new Date(period.startDate).toISOString().split('T')[0])
        if (period.endDate) setEndDate(new Date(period.endDate).toISOString().split('T')[0])
        if (period.recurringInterval) setRecurringInterval(period.recurringInterval.toString())
        if (period.recurringUnit) setRecurringUnit(period.recurringUnit)
      } catch (error) {
        console.error('Failed to load budget data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, router])

  useEffect(() => {
    const colorWithTransparency = `${PAGE_COLORS.budget}4D`
    setBaseColor(colorWithTransparency)
  }, [setBaseColor])

  const categoryConfig = useMemo(() => data ? getCategoryConfig(data.customCategories) : {}, [data])

  const saveBudget = useCallback(async (newBudget: BudgetData) => {
    try {
      setIsSaving(true)
      await createBudget({
        totalBudgetLimit: newBudget.totalBudgetLimit,
        categories: newBudget.categories,
        period: newBudget.period
      })
    } catch (error) {
      console.error('Failed to save budget:', error)
      alert('Failed to save budget. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  const processedTransactions = useMemo(() => {
    if (!data) return []
    return data.transactions.map((transaction: Transaction) => {
      const amount = parseFloat(transaction.amount)
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration, data.customCategories) : 'income',
        date: new Date(transaction.bookedDate)
      }
    })
  }, [data])

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

  // Helper functions
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

  const getCurrentPeriodRange = (period?: BudgetPeriod): string => {
    // ... implementation as in original budget-page-client.tsx ...
    return ''
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
    setIsEditingPeriod(false)
    setIsEditing(null)
    setEditValue('')
  }

  const handleSetCategoryBudget = (category: string, limit: number, customName?: string) => {
    if (!data) return
    
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
        `Monthly Budget: ${formatCurrency(budgetData.totalBudgetLimit, data.profile.currency)}\n` +
        `Other Categories Total: ${formatCurrency(otherCategoriesTotal, data.profile.currency)}\n` +
        `Available for this category: ${formatCurrency(available, data.profile.currency)}\n\n` +
        `You tried to set: ${formatCurrency(limit, data.profile.currency)}`
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

  if (loading || !data) {
    return <BudgetSkeleton customerId={customerId} />
  }

  const customBudgetCategories = budgetData.categories
    .filter(b => b.customName)
    .map(b => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const spent = processedTransactions
        .filter((t: any) => {
          const date = t.date
          return t.type === 'expense' &&
                 t.category === b.category &&
                 date.getMonth() === currentMonth &&
                 date.getFullYear() === currentYear
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

  return (
    <Sidebar customerId={customerId}>
      <div className={`${styles.container} page-gradient-background`}>
        <div className={styles.wrapper}>
          <div>
            <PageHeader 
              title="Budget" 
              subtitle="Set spending limits and track your progress"
            />

            {/* Monthly Budget Card - Simplified for space */}
            <div id="monthly-budget" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
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
                  <button 
                    className={styles.editButton}
                    onClick={() => {
                      setIsEditing('monthly')
                      setIsEditingPeriod(true)
                      setEditValue(budgetData.totalBudgetLimit.toString())
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.budgetOverview}>
                  <div className={styles.budgetSection}>
                    <div className={styles.budgetLabel}>Spent {getPeriodText(budgetData.period)}</div>
                    <div className={`${styles.budgetValue} ${isOverBudget ? styles.budgetValueOver : styles.budgetValueNormal}`}>
                      {formatCurrency(monthlyExpenses, data.profile.currency)}
                    </div>
                  </div>
                  <div className={styles.budgetSection} style={{ alignItems: 'flex-end' }}>
                    <div className={styles.budgetLabel}>Budget limit</div>
                    <div className={`${styles.budgetValue} ${styles.budgetValueMuted}`}>
                      {formatCurrency(budgetData.totalBudgetLimit, data.profile.currency)}
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
                        ? `You've exceeded your budget by ${formatCurrency(monthlyExpenses - budgetData.totalBudgetLimit, data.profile.currency)}`
                        : `You have ${formatCurrency(budgetData.totalBudgetLimit - monthlyExpenses, data.profile.currency)} remaining ${getPeriodText(budgetData.period)}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Budgets - Simplified */}
            {allCategoriesWithBudget.length > 0 && (
              <div id="category-budgets" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Category Budgets</h2>
                  <p className={styles.cardDescription}>Track spending limits for specific categories</p>
                </div>
                <div className={styles.categoryGrid}>
                  {allCategoriesWithBudget.map(({ category, spent, limit, customName }) => {
                    const config = categoryConfig[category] || categoryConfig.other
                    const progress = (spent / limit) * 100
                    const isOver = spent > limit
                    const itemKey = customName ? `${category}-${customName}` : category

                    return (
                      <div key={itemKey} className={styles.categoryItem}>
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
                                {formatCurrency(spent, data.profile.currency)} of {formatCurrency(limit, data.profile.currency)}
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
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ 
                              width: `${Math.min(progress, 100)}%`,
                              background: isOver 
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                                : progress >= 80
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : 'linear-gradient(90deg, #10b981, #059669)'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add Category Section - Simplified */}
            <div id="add-category" className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
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
                      <div key={category}>
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
                                {spent > 0 ? `Spent ${formatCurrency(spent, data.profile.currency)} ${getPeriodText(budgetData.period)}` : `No spending ${getPeriodText(budgetData.period)}`}
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
    </Sidebar>
  )
}
