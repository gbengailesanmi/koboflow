import type { CustomCategory } from '@/types/custom-category'
import { DEFAULT_CATEGORIES } from '@money-mapper/shared'

const DEFAULT_CATEGORY_KEYWORDS_MAP: Record<string, string> = 
  DEFAULT_CATEGORIES.reduce((acc, category) => {
    if (category.name === 'Other') return acc
    
    category.keywords.forEach(keyword => {
      acc[keyword.toLowerCase()] = category.name
    })
    return acc
  }, {} as Record<string, string>)

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
