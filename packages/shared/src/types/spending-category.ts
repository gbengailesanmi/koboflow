// Individual spending category (part of UserSpendingCategories document)
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

// Document structure: ONE per user containing all spending categories
export type UserSpendingCategories = {
  _id?: string
  customerId: string
  categories: SpendingCategory[]
  createdAt: Date
  updatedAt: Date
}

// Input types
export type SpendingCategoryInput = {
  name: string
  keywords: string[]
  color?: string
}

// Legacy type aliases for backwards compatibility
export type Category = SpendingCategory
export type UserCategories = UserSpendingCategories
export type CategoryInput = SpendingCategoryInput
export type CustomCategory = SpendingCategory
export type CustomCategoryInput = SpendingCategoryInput
