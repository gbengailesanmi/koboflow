import type { CustomCategory } from '@/types/custom-category'
import { DEFAULT_CATEGORIES } from '@money-mapper/shared'

// Generate category keys from default categories
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

export const categorizeTransaction = (narration: string, customCategories?: CustomCategory[]): string => {
  const text = narration.toLowerCase()
  
  for (const category of DEFAULT_CATEGORIES) {
    if (category.name === 'Other') continue // Skip "Other", it's the fallback
    
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return DEFAULT_CATEGORY_KEYS[category.name] || 'other'
      }
    }
  }
  
  // Check custom categories
  if (customCategories && customCategories.length > 0) {
    for (const category of customCategories) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return `custom_${category.id}`
        }
      }
    }
  }
  
  return 'other'
}
