export type CategoryBudget = {
  category: string
  limit: number
  customName?: string
  spent?: number
  percentage?: number
}

export type BudgetPeriodType = 'current-month' | 'custom-date' | 'recurring'

export type BudgetPeriod = {
  type: BudgetPeriodType
  startDate?: Date
  endDate?: Date
  recurringInterval?: number
  recurringUnit?: 'days' | 'months' | 'years'
}

export type Budget = {
  _id?: string
  customerId: string
  name: string
  isActive: boolean
  totalBudgetLimit: number
  period?: BudgetPeriod
  categories: CategoryBudget[]
  createdAt: Date
  updatedAt: Date
}
