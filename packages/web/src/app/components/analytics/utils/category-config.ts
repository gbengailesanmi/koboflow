import type { CustomCategory } from '@/types/custom-category'

export const categoryConfig: Record<string, { label: string; color: string }> = {
  food: { label: 'Food & Groceries', color: '#10b981' },
  transport: { label: 'Transportation', color: '#3b82f6' },
  dining: { label: 'Dining Out', color: '#f59e0b' },
  shopping: { label: 'Shopping', color: '#ef4444' },
  utilities: { label: 'Utilities', color: '#8b5cf6' },
  housing: { label: 'Housing', color: '#06b6d4' },
  healthcare: { label: 'Healthcare', color: '#ec4899' },
  entertainment: { label: 'Entertainment', color: '#84cc16' },
  other: { label: 'Other', color: '#6b7280' }
}

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
