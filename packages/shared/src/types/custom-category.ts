// Individual category (part of UserCategories document)
export type Category = {
  id: string
  name: string
  keywords: string[]
  color: string
  isDefault: boolean // true for built-in categories, false for custom
  isEditable: boolean // false for default categories, true for custom
  createdAt: Date
  updatedAt: Date
}

// Document structure: ONE per user
export type UserCategories = {
  _id?: string
  customerId: string
  categories: Category[]
  createdAt: Date
  updatedAt: Date
}

// Input types
export type CategoryInput = {
  name: string
  keywords: string[]
  color?: string
}

// Legacy type alias for backwards compatibility
export type CustomCategory = Category
export type CustomCategoryInput = CategoryInput
