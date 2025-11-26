export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Other',
] as const

export const BUDGET_PERIODS = {
  CURRENT_MONTH: 'current-month',
  CUSTOM_DATE: 'custom-date',
  RECURRING: 'recurring',
} as const
