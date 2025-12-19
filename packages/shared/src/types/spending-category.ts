export type SpendingCategory = {
  id: string
  name: string
  keywords: string[]
  color: string
  isDefault: boolean // true for built-in categories, false for custom
  isEditable: boolean // false for default categories, true for custom
  createdAt: Date
  updatedAt: Date
}

export type UserSpendingCategories = {
  _id?: string
  customerId: string
  categories: SpendingCategory[]
  createdAt: Date
  updatedAt: Date
}

export type SpendingCategoryInput = {
  name: string
  keywords: string[]
  color?: string
}

export type Category = SpendingCategory
export type UserCategories = UserSpendingCategories
export type CategoryInput = SpendingCategoryInput
export type CustomCategory = SpendingCategory
export type CustomCategoryInput = SpendingCategoryInput
