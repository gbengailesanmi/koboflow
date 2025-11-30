import type { CustomCategory } from '@/types/custom-category'

// Default category keywords
const defaultCategoryKeywords: Record<string, string[]> = {
  food: ['grocery', 'supermarket', 'food', 'tesco', 'sainsbury', 'asda', 'aldi', 'lidl', 'waitrose', 'morrisons'],
  transport: ['gas', 'fuel', 'petrol', 'diesel', 'shell', 'bp', 'esso', 'train', 'bus', 'tube', 'uber', 'taxi'],
  dining: ['restaurant', 'cafe', 'dining', 'mcdonald', 'kfc', 'nando', 'pizza', 'starbucks', 'costa', 'pret'],
  shopping: ['shop', 'store', 'retail', 'amazon', 'ebay', 'argos', 'john lewis', 'next', 'h&m', 'm&s', 'primark', 'zara'],
  utilities: ['utility', 'electric', 'water', 'internet', 'british gas', 'edf', 'eon', 'virgin', 'sky', 'bt'],
  housing: ['rent', 'mortgage', 'housing', 'council tax', 'estate agent'],
  healthcare: ['medical', 'hospital', 'pharmacy', 'boots', 'superdrug', 'nhs', 'doctor', 'dentist'],
  entertainment: ['entertainment', 'movie', 'game', 'cinema', 'netflix', 'spotify', 'apple music', 'disney', 'gym'],
  other: []
}

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
