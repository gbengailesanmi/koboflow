
export type CategoryBudget = {
  category: string
  limit: number
  customName?: string // Custom name for categories (e.g., "Other" → "Miscellaneous")
  spent?: number // Current month spending in this category
  percentage?: number // Percentage of limit used
}

export type BudgetPeriodType = 'current-month' | 'custom-date' | 'recurring'

export type BudgetPeriod = {
  type: BudgetPeriodType
  startDate?: Date // For custom-date and recurring
  endDate?: Date // For custom-date only
  recurringInterval?: number // For recurring (e.g., 3 for "every 3 months")
  recurringUnit?: 'days' | 'months' | 'years' // For recurring
}

export type Budget = {
  _id?: string
  customerId: string
  monthly: number // Budget amount (name kept for backwards compatibility)
  period?: BudgetPeriod // Budget period settings
  categories: CategoryBudget[]
  createdAt: Date
  updatedAt: Date
}
