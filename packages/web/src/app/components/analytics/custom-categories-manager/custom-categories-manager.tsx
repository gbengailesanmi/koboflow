'use client'

import React, { useState } from 'react'
import type { CustomCategory } from '@/types/custom-category'
import styles from './custom-categories-manager.module.css'

type CustomCategoriesManagerProps = {
  categories: CustomCategory[]
  onAdd: (name: string, keywords: string[], color: string) => Promise<void>
  onUpdate: (id: string, name: string, keywords: string[], color: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const defaultColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#6b7280'
]

export function CustomCategoriesManager({ 
  categories, 
  onAdd, 
  onUpdate, 
  onDelete 
}: CustomCategoriesManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    color: defaultColors[0]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.keywords.trim()) return

    setLoading(true)
    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      if (editingId) {
        await onUpdate(editingId, formData.name, keywords, formData.color)
        setEditingId(null)
      } else {
        await onAdd(formData.name, keywords, formData.color)
        setIsAdding(false)
      }

      setFormData({ name: '', keywords: '', color: defaultColors[0] })
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: CustomCategory) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      keywords: category.keywords.join(', '),
      color: category.color
    })
    setIsAdding(false)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', keywords: '', color: defaultColors[0] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    setLoading(true)
    try {
      await onDelete(id)
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Custom Categories</h3>
          <p className={styles.description}>
            Create custom spending categories with keywords for automatic categorization
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            className={styles.addButton}
            onClick={() => setIsAdding(true)}
          >
            ➕ Add Category
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Netflix, Subscriptions, Pet Care"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="e.g., netflix, streaming, subscription"
              className={styles.input}
              required
            />
            <p className={styles.helpText}>
              Transactions containing these keywords will be automatically categorized
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Color</label>
            <div className={styles.colorPicker}>
              {defaultColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorOption} ${formData.color === color ? styles.colorOptionSelected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add Category'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.categoriesList}>
        {categories.map(category => (
          <div key={category.id} className={styles.categoryItem}>
            <div className={styles.categoryInfo}>
              <div
                className={styles.categoryColor}
                style={{ backgroundColor: category.color }}
              />
              <div className={styles.categoryDetails}>
                <h4 className={styles.categoryName}>{category.name}</h4>
                <p className={styles.categoryKeywords}>
                  Keywords: {category.keywords.join(', ')}
                </p>
              </div>
            </div>
            <div className={styles.categoryActions}>
              <button
                className={styles.iconButton}
                onClick={() => handleEdit(category)}
                disabled={loading}
              >
                ✏️
              </button>
              <button
                className={styles.iconButton}
                onClick={() => handleDelete(category.id)}
                disabled={loading}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !isAdding && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No custom categories yet. Create one to get started!
          </p>
        </div>
      )}
    </div>
  )
}
