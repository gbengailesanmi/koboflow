import type { CustomCategory } from '@/types/custom-category'
import { DEFAULT_CATEGORIES } from '@money-mapper/shared'

const DEFAULT_CATEGORY_KEYS: Record<string, string> = {
  'Food & Groceries': 'food',
  'Transport': 'transport',
  'Dining & Restaurants': 'dining',
  'Shopping': 'shopping',
  'Utilities': 'utilities',
  'Housing': 'housing',
  'Healthcare': 'healthcare',
  'Entertainment': 'entertainment',
  'Other': 'other'
}

export const categoryConfig: Record<string, { label: string; color: string }> = 
  DEFAULT_CATEGORIES.reduce((acc, category) => {
    const key = DEFAULT_CATEGORY_KEYS[category.name]
    if (key) {
      acc[key] = {
        label: category.name,
        color: category.color
      }
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

export function getCategoryConfig(customCategories?: CustomCategory[]) {
  const config = { ...categoryConfig }
  
  if (customCategories) {
    customCategories.forEach(cat => {
      config[`custom_${cat.id}`] = {
        label: cat.name,
        color: cat.color
      }
    })
  }
  
  return config
}
