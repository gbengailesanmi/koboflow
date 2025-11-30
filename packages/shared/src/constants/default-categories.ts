import { Category } from '../types/custom-category'

// Default categories that every user gets
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Food & Groceries',
    keywords: ['grocery', 'supermarket', 'food', 'tesco', 'sainsbury', 'asda', 'aldi', 'lidl', 'waitrose', 'morrisons'],
    color: '#10b981', // green
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Transport',
    keywords: ['gas', 'fuel', 'petrol', 'diesel', 'shell', 'bp', 'esso', 'train', 'bus', 'tube', 'uber', 'taxi'],
    color: '#3b82f6', // blue
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Dining & Restaurants',
    keywords: ['restaurant', 'cafe', 'dining', 'mcdonald', 'kfc', 'nando', 'pizza', 'starbucks', 'costa', 'pret'],
    color: '#f59e0b', // amber
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Shopping',
    keywords: ['shop', 'store', 'retail', 'amazon', 'ebay', 'argos', 'john lewis', 'next', 'h&m', 'm&s', 'primark', 'zara'],
    color: '#ec4899', // pink
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Utilities',
    keywords: ['utility', 'electric', 'water', 'internet', 'british gas', 'edf', 'eon', 'virgin', 'sky', 'bt'],
    color: '#8b5cf6', // purple
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Housing',
    keywords: ['rent', 'mortgage', 'housing', 'council tax', 'estate agent'],
    color: '#06b6d4', // cyan
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Healthcare',
    keywords: ['medical', 'hospital', 'pharmacy', 'boots', 'superdrug', 'nhs', 'doctor', 'dentist'],
    color: '#ef4444', // red
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Entertainment',
    keywords: ['entertainment', 'movie', 'game', 'cinema', 'netflix', 'spotify', 'apple music', 'disney', 'gym'],
    color: '#f97316', // orange
    isDefault: true,
    isEditable: false
  },
  {
    name: 'Other',
    keywords: [],
    color: '#6b7280', // gray
    isDefault: true,
    isEditable: false
  }
]
