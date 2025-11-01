'use client'

import React, { useMemo, useState } from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useParams, useRouter } from 'next/navigation'
import type { Transaction } from '@/types/transactions'
import Footer from '@/app/components/footer/footer'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { categoryConfig } from '@/app/components/analytics/utils/category-config'
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
}

type BudgetData = {
  monthly: number
  categories: CategoryBudget[]
}

type BudgetClientProps = {
  transactions: Transaction[]
  profile: UserProfile
}

export default function BudgetClient({ transactions, profile }: BudgetClientProps) {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  // Load budget data from database
  const [budgetData, setBudgetData] = useState<BudgetData>({
    monthly: profile.monthlyBudget || 5000,
    categories: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Fetch budget data from database
  React.useEffect(() => {
    async function fetchBudget() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/budget')
        if (response.ok) {
          const data = await response.json()
          setBudgetData({
            monthly: data.monthly || profile.monthlyBudget || 5000,
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
        category: amount < 0 ? categorizeTransaction(transaction.narration) : 'income',
        date: new Date(transaction.bookedDate)
      }
    })
  }, [transactions])

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

      const budget = budgetData.categories.find(b => b.category === category)
      
      return {
        category,
        spent,
        limit: budget?.limit || 0,
        hasLimit: !!budget
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

  const handleSetCategoryBudget = (category: string, limit: number) => {
    const newBudget = {
      ...budgetData,
      categories: (() => {
        const existing = budgetData.categories.find(b => b.category === category)
        if (existing) {
          return budgetData.categories.map(b => 
            b.category === category ? { ...b, limit } : b
          )
        }
        return [...budgetData.categories, { category, limit }]
      })()
    }
    setBudgetData(newBudget)
    saveBudget(newBudget)
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
                  <span className={styles.progressLabelText}>Progress</span>
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
                      ? `You've exceeded your monthly budget by ${formatCurrency(monthlyExpenses - budgetData.monthly, profile.currency)}`
                      : `You have ${formatCurrency(budgetData.monthly - monthlyExpenses, profile.currency)} remaining this month`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories with Budget */}
          {categoriesWithBudget.length > 0 && (
            <div className={styles.card} style={{ margin: '0 16px 32px 16px' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Category Budgets</h2>
                <p className={styles.cardDescription}>
                  Track spending limits for specific categories
                </p>
              </div>
              <div className={styles.categoryGrid}>
                {categoriesWithBudget.map(({ category, spent, limit }) => {
                  const config = categoryConfig[category] || categoryConfig.other
                  const progress = (spent / limit) * 100
                  const isOver = spent > limit
                  const isNearLimit = progress >= 80 && !isOver

                  return (
                    <div key={category} className={styles.categoryItem}>
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
                            <div className={styles.categoryName}>{config.label}</div>
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
                            onClick={() => startEdit(category, limit)}
                          >
                            ✏️
                          </button>
                          <button 
                            className={styles.iconButton}
                            onClick={() => handleRemoveCategoryBudget(category)}
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
                      {isEditing === category && (
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
                              if (amount > 0) handleSetCategoryBudget(category, amount)
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
                            <div className={styles.categoryName}>{config.label}</div>
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
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', padding: '0 12px' }}>
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
                              if (amount > 0) handleSetCategoryBudget(category, amount)
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
