'use client'

import React, { useState, useMemo } from 'react'
import type { CustomCategory } from '@/types/custom-category'
import { formatCurrency } from '../utils/format-currency'
import { getCategoryConfig } from '../utils/category-config'
import { validateKeywords } from '../utils/validate-keywords'
import { CategoryData } from '../types/analytics-types'
import styles from './category-breakdown.module.css'

type CategoryBreakdownProps = {
  categoryData: CategoryData[]
  currency: string
  customCategories: CustomCategory[]
  onAddCategory: (name: string, keywords: string[]) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ 
  categoryData, 
  currency, 
  customCategories,
  onAddCategory,
  onDeleteCategory 
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const categoryConfig = getCategoryConfig(customCategories)
  
  const allCategories = useMemo(() => {
    const categories = [...categoryData]
    
    customCategories.forEach(customCat => {
      const customKey = `custom_${customCat.id}`
      if (!categories.find(cat => cat.category === customKey)) {
        categories.push({
          category: customKey,
          amount: 0,
          percentage: 0,
          count: 0
        })
      }
    })
    
    return categories.sort((a, b) => b.amount - a.amount)
  }, [categoryData, customCategories])
  
  const handleAdd = async () => {
    if (!categoryName.trim() || !keywords.trim()) return
    
    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
    
    const validation = validateKeywords(keywordArray, customCategories)
    if (!validation.isValid) {
      const errorMessages = validation.conflicts.map(conflict => {
        if (conflict.isDefault) {
          return `Keyword "${conflict.keyword}" already captured under ${conflict.categoryName} category.`
        } else {
          return `Keyword "${conflict.keyword}" already used in "${conflict.categoryName}" custom category.`
        }
      })
      setError(errorMessages.join(' '))
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await onAddCategory(categoryName.trim(), keywordArray)
      setCategoryName('')
      setKeywords('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add category:', error)
      setError('Failed to add category. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (categoryKey: string) => {
    if (!categoryKey.startsWith('custom_')) return
    
    const id = categoryKey.replace('custom_', '')
    if (!confirm('Delete this custom category?')) return
    
    setLoading(true)
    try {
      await onDeleteCategory(id)
    } catch (error) {
      console.error('Failed to delete category:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (categoryData.length === 0 && customCategories.length === 0) {
    return (
      <div className={styles.container}>
        {isAdding && (
          <div className={styles.addForm}>
            <div>
              <input
                type="text"
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={styles.input}
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Keywords (comma-separated)"
                value={keywords}
                onChange={(e) => {
                  setKeywords(e.target.value)
                  setError('') // Clear error when user types
                }}
                className={styles.input}
                disabled={loading}
              />
              <div className={styles.formButtons}>
                <button onClick={handleAdd} className={styles.saveBtn} disabled={loading}>
                  {loading ? '...' : '✓'}
                </button>
                <button onClick={() => {
                  setIsAdding(false)
                  setError('')
                }} className={styles.cancelBtn} disabled={loading}>
                  ✕
                </button>
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className={styles.addButton}>
            ➕ Add Custom Category
          </button>
        )}
        <div className={styles.noData}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          No expense data for this period
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {isAdding && (
        <div className={styles.addForm}>
          <div>
            <input
              type="text"
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Keywords (comma-separated)"
              value={keywords}
              onChange={(e) => {
                setKeywords(e.target.value)
                setError('') // Clear error when user types
              }}
              className={styles.input}
              disabled={loading}
            />
            <div className={styles.formButtons}>
              <button onClick={handleAdd} className={styles.saveBtn} disabled={loading}>
                {loading ? '...' : '✓'}
              </button>
              <button onClick={() => {
                setIsAdding(false)
                setError('')
              }} className={styles.cancelBtn} disabled={loading}>
                ✕
              </button>
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}
      {!isAdding && (
        <button onClick={() => setIsAdding(true)} className={styles.addButton}>
          ➕
        </button>
      )}
      <div className={styles.categoryList}>
        {allCategories.slice(0, 10).map((cat) => {
          const config = categoryConfig[cat.category] || categoryConfig.other
          const isCustom = cat.category.startsWith('custom_')
          
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
                  {formatCurrency(cat.amount, currency)}
                </span>
                {isCustom && (
                  <button 
                    onClick={() => handleDelete(cat.category)}
                    className={styles.deleteBtn}
                    disabled={loading}
                    title="Delete category"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
