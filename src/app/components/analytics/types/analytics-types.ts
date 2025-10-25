export type UserProfile = {
  name: string
  email: string
  currency: string
  monthlyBudget: number
}

export type CategoryData = {
  category: string
  amount: number
  percentage: number
  count: number
}

export type RecurringPayment = {
  pattern: string
  category: string
  averageAmount: number
  count: number
  intervalDays: number
  lastPayment: Date
  nextPayment: Date
  transactions: Array<{ date: Date; amount: number; narration: string }>
}
