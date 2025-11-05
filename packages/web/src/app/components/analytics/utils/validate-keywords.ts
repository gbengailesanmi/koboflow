import type { CustomCategory } from '@/types/custom-category'

// Map of default category keywords to their category names
const DEFAULT_CATEGORY_KEYWORDS_MAP: Record<string, string> = {
  // Food
  'grocery': 'Food',
  'supermarket': 'Food',
  'food': 'Food',
  // Transport
  'gas': 'Transport',
  'fuel': 'Transport',
  'petrol': 'Transport',
  // Dining
  'restaurant': 'Dining',
  'cafe': 'Dining',
  'dining': 'Dining',
  // Shopping
  'shop': 'Shopping',
  'store': 'Shopping',
  'retail': 'Shopping',
  // Utilities
  'utility': 'Utilities',
  'electric': 'Utilities',
  'water': 'Utilities',
  'internet': 'Utilities',
  // Housing
  'rent': 'Housing',
  'mortgage': 'Housing',
  'housing': 'Housing',
  // Healthcare
  'medical': 'Healthcare',
  'hospital': 'Healthcare',
  'pharmacy': 'Healthcare',
  // Entertainment
  'entertainment': 'Entertainment',
  'movie': 'Entertainment',
  'game': 'Entertainment'
}

type KeywordConflict = {
  keyword: string
  categoryName: string
  isDefault: boolean
}

/**
 * Validates that keywords don't conflict with existing default or custom categories
 * Returns an object with validation result and detailed conflict information
 */
export function validateKeywords(
  newKeywords: string[],
  customCategories: CustomCategory[],
  excludeCategoryId?: string
): { isValid: boolean; conflicts: KeywordConflict[] } {
  const conflicts: KeywordConflict[] = []
  
  // Normalize keywords to lowercase
  const normalizedNewKeywords = newKeywords.map(k => k.toLowerCase().trim())
  
  // Check against default category keywords
  for (const keyword of normalizedNewKeywords) {
    const categoryName = DEFAULT_CATEGORY_KEYWORDS_MAP[keyword]
    if (categoryName) {
      conflicts.push({
        keyword,
        categoryName,
        isDefault: true
      })
    }
  }
  
  // Check against existing custom category keywords
  for (const category of customCategories) {
    // Skip the category being edited (if excludeCategoryId is provided)
    if (excludeCategoryId && category.id === excludeCategoryId) {
      continue
    }
    
    for (const existingKeyword of category.keywords) {
      const normalizedExisting = existingKeyword.toLowerCase().trim()
      if (normalizedNewKeywords.includes(normalizedExisting)) {
        conflicts.push({
          keyword: existingKeyword,
          categoryName: category.name,
          isDefault: false
        })
      }
    }
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts
  }
}

/**
 * Get all default category keywords
 */
export function getDefaultKeywords(): string[] {
  return Object.keys(DEFAULT_CATEGORY_KEYWORDS_MAP)
}
