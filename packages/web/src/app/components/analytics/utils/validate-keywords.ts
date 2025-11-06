import type { CustomCategory } from '@/types/custom-category'

const DEFAULT_CATEGORY_KEYWORDS_MAP: Record<string, string> = {
  'grocery': 'Food',
  'supermarket': 'Food',
  'food': 'Food',
  'gas': 'Transport',
  'fuel': 'Transport',
  'petrol': 'Transport',
  'restaurant': 'Dining',
  'cafe': 'Dining',
  'dining': 'Dining',
  'shop': 'Shopping',
  'store': 'Shopping',
  'retail': 'Shopping',
  'utility': 'Utilities',
  'electric': 'Utilities',
  'water': 'Utilities',
  'internet': 'Utilities',
  'rent': 'Housing',
  'mortgage': 'Housing',
  'housing': 'Housing',
  'medical': 'Healthcare',
  'hospital': 'Healthcare',
  'pharmacy': 'Healthcare',
  'entertainment': 'Entertainment',
  'movie': 'Entertainment',
  'game': 'Entertainment'
}

type KeywordConflict = {
  keyword: string
  categoryName: string
  isDefault: boolean
}

export function validateKeywords(
  newKeywords: string[],
  customCategories: CustomCategory[],
  excludeCategoryId?: string
): { isValid: boolean; conflicts: KeywordConflict[] } {
  const conflicts: KeywordConflict[] = []
  
  const normalizedNewKeywords = newKeywords.map(k => k.toLowerCase().trim())
  
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
  
  for (const category of customCategories) {
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

export function getDefaultKeywords(): string[] {
  return Object.keys(DEFAULT_CATEGORY_KEYWORDS_MAP)
}
