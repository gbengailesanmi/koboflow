'use client'

import React, { useState, useMemo } from 'react'
import type { CustomCategory } from '@/types/custom-category'
import { formatCurrency } from '../utils/format-currency'
import { getCategoryConfig } from '../utils/category-config'
import { validateKeywords } from '../utils/validate-keywords'
import { getCategoryKeywords } from '../utils/category-keywords'
import { CategoryData } from '../types/analytics-types'
import { Dialog, Button, Flex, Text } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import styles from './category-breakdown.module.css'

type CategoryBreakdownProps = {
  categoryData: CategoryData[]
  currency: string
  customCategories: CustomCategory[]
  onAddCategory: (name: string, keywords: string[]) => Promise<void>
  onUpdateCategory: (id: string, updates: { name?: string; keywords?: string[]; color?: string }) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ 
  categoryData, 
  currency, 
  customCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory 
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<{
    label: string
    keywords: string[]
    categoryKey: string
  } | null>(null)
  
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
  
  const handleDeleteKeyword = async (keyword: string) => {
    if (!selectedCategory) return
    
    // Only custom categories can have keywords deleted
    if (!selectedCategory.categoryKey.startsWith('custom_')) {
      return
    }
    
    const customId = selectedCategory.categoryKey.replace('custom_', '')
    const customCat = customCategories.find(c => c.id === customId)
    
    if (!customCat) return
    
    const updatedKeywords = customCat.keywords.filter(k => k !== keyword)
    
    // A category must have at least one keyword
    if (updatedKeywords.length === 0) {
      alert('A category must have at least one keyword')
      return
    }
    
    setLoading(true)
    try {
      await onUpdateCategory(customId, { keywords: updatedKeywords })
      
      // Update the selected category state to reflect the change
      setSelectedCategory({
        ...selectedCategory,
        keywords: updatedKeywords
      })
    } catch (error) {
      console.error('Failed to delete keyword:', error)
      alert('Failed to delete keyword. Please try again.')
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
          const keywords = getCategoryKeywords(cat.category, customCategories)
          
          return (
            <div key={cat.category} className={styles.categoryItem}>
              <div 
                className={styles.categoryItemLeft}
                onClick={() => {
                  // Don't open dialog for "other" category
                  if (cat.category === 'other') return
                  setSelectedCategory({ 
                    label: config.label, 
                    keywords,
                    categoryKey: cat.category
                  })
                }}
                style={{ cursor: cat.category === 'other' ? 'default' : 'pointer' }}
              >
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
                <button 
                  onClick={() => isCustom ? handleDelete(cat.category) : undefined}
                  className={styles.deleteBtn}
                  disabled={loading || !isCustom}
                  title={isCustom ? "Delete category" : ""}
                  type="button"
                  style={{ visibility: isCustom ? 'visible' : 'hidden' }}
                >
                  <Cross2Icon width="14" height="14" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Keywords Dialog */}
      <Dialog.Root open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>{selectedCategory?.label}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Keywords that categorize transactions under this category
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <div className={styles.keywordsGrid}>
              {selectedCategory?.keywords.map((keyword, index) => (
                <div key={index} className={styles.keywordChip}>
                  <span className={styles.keywordText}>
                    {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
                  </span>
                  {selectedCategory.categoryKey.startsWith('custom_') && (
                    <button
                      className={styles.keywordDeleteBtn}
                      onClick={() => handleDeleteKeyword(keyword)}
                      title="Delete keyword"
                      type="button"
                    >
                      <Cross2Icon width="14" height="14" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {selectedCategory?.keywords.length === 0 && (
              <Text size="2" color="gray">
                No keywords defined for this category
              </Text>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
