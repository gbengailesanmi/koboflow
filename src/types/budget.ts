
export type CategoryBudget = {
  category: string
  limit: number
  customName?: string // Custom name for categories (e.g., "Other" → "Miscellaneous")
  spent?: number // Current month spending in this category
  percentage?: number // Percentage of limit used
}

export type Budget = {
  _id?: string
  customerId: string
  monthly: number // Monthly total budget
  categories: CategoryBudget[]
  createdAt: Date
  updatedAt: Date
}

export type BudgetSpending = {
  customerId: string
  month: string // Format: "YYYY-MM"
  totalSpent: number
  categorySpending: {
    category: string
    amount: number
  }[]
  updatedAt: Date
}
