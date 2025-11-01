import type { CustomCategory } from '@/types/custom-category'

// Simple category mapping based on transaction narration
export const categorizeTransaction = (narration: string, customCategories?: CustomCategory[]): string => {
  const text = narration.toLowerCase()
  
  // Check default categories first
  if (text.includes('grocery') || text.includes('supermarket') || text.includes('food')) return 'food'
  if (text.includes('gas') || text.includes('fuel') || text.includes('petrol')) return 'transport'
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('dining')) return 'dining'
  if (text.includes('shop') || text.includes('store') || text.includes('retail')) return 'shopping'
  if (text.includes('utility') || text.includes('electric') || text.includes('water') || text.includes('internet')) return 'utilities'
  if (text.includes('rent') || text.includes('mortgage') || text.includes('housing')) return 'housing'
  if (text.includes('medical') || text.includes('hospital') || text.includes('pharmacy')) return 'healthcare'
  if (text.includes('entertainment') || text.includes('movie') || text.includes('game')) return 'entertainment'
  
  // Only check custom categories if no default category matched (for transactions that would be "other")
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
