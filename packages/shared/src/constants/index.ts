export * from './default-categories'
export * from './dashboard-colors'

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
