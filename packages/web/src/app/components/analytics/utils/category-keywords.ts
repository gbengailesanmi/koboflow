import type { CustomCategory } from '@/types/custom-category'
import { DEFAULT_CATEGORIES } from '@money-mapper/shared'

// Generate category key mapping
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

// Build default category keywords from shared package
const defaultCategoryKeywords: Record<string, string[]> = 
  DEFAULT_CATEGORIES.reduce((acc, category) => {
    const key = DEFAULT_CATEGORY_KEYS[category.name]
    if (key) {
      acc[key] = category.keywords
    }
    return acc
  }, {} as Record<string, string[]>)

/**
 * Get the keywords for a specific category
 * @param category - The category key (e.g., 'food', 'transport', 'custom_123')
 * @param customCategories - Optional array of custom categories
 * @returns Array of keywords for the category
 */
export function getCategoryKeywords(category: string, customCategories?: CustomCategory[]): string[] {
  if (category.startsWith('custom_') && customCategories) {
    const customId = category.replace('custom_', '')
    const customCat = customCategories.find(c => c.id === customId)
    return customCat?.keywords || []
  }
  
  return defaultCategoryKeywords[category] || []
}

/**
 * Format keywords as a comma-separated string, capitalized
 * @param keywords - Array of keywords
 * @param maxLength - Maximum length of the formatted string (default: 100)
 * @returns Formatted keyword string with ellipsis if truncated
 */
export function formatCategoryKeywords(keywords: string[], maxLength: number = 100): string {
  if (keywords.length === 0) return ''
  
  // Capitalize first letter of each keyword
  const capitalizedKeywords = keywords.map(k => 
    k.charAt(0).toUpperCase() + k.slice(1)
  )
  
  let result = capitalizedKeywords.join(', ')
  
  // Truncate if too long
  if (result.length > maxLength) {
    result = result.substring(0, maxLength).trim()
    // Find the last complete word
    const lastComma = result.lastIndexOf(',')
    if (lastComma > 0) {
      result = result.substring(0, lastComma)
    }
    result += '...'
  }
  
  return result
}
