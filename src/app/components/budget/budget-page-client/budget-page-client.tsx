'use client'

import React, { useMemo, useState } from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useParams, useRouter } from 'next/navigation'
import type { Transaction } from '@/types/transactions'
import type { CustomCategory } from '@/types/custom-category'
import Footer from '@/app/components/footer/footer'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { getCategoryConfig } from '@/app/components/analytics/utils/category-config'
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

  // Get category config including custom categories
  const categoryConfig = useMemo(() => getCategoryConfig(customCategories), [customCategories])

  // Load budget data from database
  const [budgetData, setBudgetData] = useState<BudgetData>({
    monthly: profile.monthlyBudget || 0,
    categories: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isRenamingCategory, setIsRenamingCategory] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Fetch budget data from database
  React.useEffect(() => {
    async function fetchBudget() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/budget')
        if (response.ok) {
          const data = await response.json()
          setBudgetData({
            monthly: data.monthly || profile.monthlyBudget || 0,
            categories: data.categories || []
          })
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

  // Calculate current month expenses
  const monthlyExpenses = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return processedTransactions
      .filter(t => {
        const date = t.date
        return t.type === 'expense' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + t.numericAmount, 0)
  }, [processedTransactions])

  // Calculate category expenses
  const categoryExpenses = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const categories = Object.keys(categoryConfig).filter(cat => cat !== 'income')
    
    return categories.map(category => {
      const spent = processedTransactions
        .filter(t => {
          const date = t.date
          return t.type === 'expense' &&
                 t.category === category &&
                 date.getMonth() === currentMonth &&
                 date.getFullYear() === currentYear
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
  }, [processedTransactions, budgetData.categories])

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
              <h1 className={styles.title}>Budget</h1>
            </div>
          </div>
          <div className={styles.subtitle}>
            <p className={styles.subtitleText}>Set spending limits and track your progress</p>
          </div>

          {/* Monthly Budget Card */}
          <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderFlex}>
                <div className={styles.cardTitleSection}>
                  <div className={styles.iconWrapper}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Monthly Budget</h2>
                    <p className={styles.cardDescription}>
                      Overall spending limit for this month
                    </p>
                  </div>
                </div>
                {isEditing !== 'monthly' ? (
                  <button 
                    className={styles.editButton}
                    onClick={() => startEdit('monthly', budgetData.monthly)}
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter amount"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        width: '120px'
                      }}
                    />
                    <button 
                      className={styles.editButton}
                      onClick={() => {
                        const amount = parseFloat(editValue)
                        if (amount > 0) handleUpdateMonthlyBudget(amount)
                      }}
                    >
                      ✓
                    </button>
                    <button 
                      className={styles.editButton}
                      onClick={() => {
                        setIsEditing(null)
                        setEditValue('')
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.budgetOverview}>
                <div className={styles.budgetSection}>
                  <div className={styles.budgetLabel}>Spent this month</div>
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
                      ? `You've exceeded your monthly budget by ${formatCurrency(monthlyExpenses - budgetData.monthly, profile.currency)}`
                      : `You have ${formatCurrency(budgetData.monthly - monthlyExpenses, profile.currency)} remaining this month`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories with Budget */}
          {allCategoriesWithBudget.length > 0 && (
            <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
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
          <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
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
                              {spent > 0 ? `Spent ${formatCurrency(spent, profile.currency)} this month` : 'No spending this month'}
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
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}
