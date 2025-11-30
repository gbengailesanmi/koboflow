import { connectDB } from '../mongo'
import { UserCategories, Category, CategoryInput } from '@money-mapper/shared'
import { DEFAULT_CATEGORIES } from '@money-mapper/shared'
import { randomUUID } from 'crypto'

const COLLECTION = 'spending_categories'

/**
 * Get or create user categories document
 * Creates default categories if document doesn't exist
 */
export async function getUserCategories(customerId: string): Promise<UserCategories> {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)
  
  let userCategories = await collection.findOne({ customerId }) as UserCategories | null
  
  if (!userCategories) {
    console.log(`[Categories] Creating new categories document for user: ${customerId}`)
    
    // Create new document with default categories
    const now = new Date()
    const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    }))
    
    console.log(`[Categories] Generated ${defaultCategories.length} default categories:`)
    defaultCategories.forEach(cat => {
      console.log(`[Categories]    - ${cat.name} (${cat.keywords.length} keywords, ${cat.color})`)
    })
    
    const newDoc: UserCategories = {
      customerId,
      categories: defaultCategories,
      createdAt: now,
      updatedAt: now
    }
    
    await collection.insertOne(newDoc)
    console.log(`[Categories] ✅ Document inserted into ${COLLECTION} collection`)
    
    userCategories = await collection.findOne({ customerId }) as UserCategories | null
  }
  
  return userCategories!
}

/**
 * Get all categories for a user (default + custom)
 */
export async function getCategories(customerId: string): Promise<Category[]> {
  const userCategories = await getUserCategories(customerId)
  return userCategories.categories
}

/**
 * Get a specific category by ID
 */
export async function getCategoryById(customerId: string, categoryId: string): Promise<Category | null> {
  const userCategories = await getUserCategories(customerId)
  return userCategories.categories.find(cat => cat.id === categoryId) || null
}

/**
 * Add a new custom category
 */
export async function addCategory(
  customerId: string, 
  input: CategoryInput
): Promise<Category> {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)
  
  const now = new Date()
  const newCategory: Category = {
    id: randomUUID(),
    name: input.name,
    keywords: input.keywords.map(k => k.toLowerCase()),
    color: input.color || '#6b7280',
    isDefault: false,
    isEditable: true,
    createdAt: now,
    updatedAt: now
  }
  
  await collection.updateOne(
    { customerId },
    { 
      $push: { categories: newCategory },
      $set: { updatedAt: now }
    }
  )
  
  return newCategory
}

/**
 * Update a category (only if it's editable)
 */
export async function updateCategory(
  customerId: string,
  categoryId: string,
  updates: Partial<Pick<Category, 'name' | 'keywords' | 'color'>>
): Promise<boolean> {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)
  
  const userCategories = await getUserCategories(customerId)
  const categoryIndex = userCategories.categories.findIndex(cat => cat.id === categoryId)
  
  if (categoryIndex === -1) return false
  
  const category = userCategories.categories[categoryIndex]
  
  // Only allow editing custom categories
  if (!category.isEditable) {
    throw new Error('Cannot edit default categories')
  }
  
  // Build update object
  const now = new Date()
  const updateFields: any = {}
  
  if (updates.name) {
    updateFields[`categories.${categoryIndex}.name`] = updates.name
  }
  if (updates.keywords) {
    updateFields[`categories.${categoryIndex}.keywords`] = updates.keywords.map(k => k.toLowerCase())
  }
  if (updates.color) {
    updateFields[`categories.${categoryIndex}.color`] = updates.color
  }
  
  updateFields[`categories.${categoryIndex}.updatedAt`] = now
  updateFields.updatedAt = now
  
  const result = await collection.updateOne(
    { customerId },
    { $set: updateFields }
  )
  
  return result.modifiedCount > 0
}

/**
 * Delete a custom category
 */
export async function deleteCategory(
  customerId: string,
  categoryId: string
): Promise<boolean> {
  const db = await connectDB()
  const collection = db.collection(COLLECTION)
  
  const userCategories = await getUserCategories(customerId)
  const category = userCategories.categories.find(cat => cat.id === categoryId)
  
  if (!category) return false
  
  // Only allow deleting custom categories
  if (!category.isEditable) {
    throw new Error('Cannot delete default categories')
  }
  
  const result = await collection.updateOne(
    { customerId },
    { 
      $pull: { categories: { id: categoryId } },
      $set: { updatedAt: new Date() }
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Get all custom categories (non-default)
 */
export async function getCustomCategories(customerId: string): Promise<Category[]> {
  const categories = await getCategories(customerId)
  return categories.filter(cat => !cat.isDefault)
}

/**
 * Get all default categories
 */
export async function getDefaultCategories(customerId: string): Promise<Category[]> {
  const categories = await getCategories(customerId)
  return categories.filter(cat => cat.isDefault)
}

/**
 * Initialize user categories with defaults (called on user signup/first login)
 */
export async function initializeUserCategories(customerId: string): Promise<UserCategories> {
  return getUserCategories(customerId) // Will create if doesn't exist
}
