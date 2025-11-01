import { connectDB } from '@/db/mongo'
import type { CustomCategory, CustomCategoryInput } from '@/types/custom-category'
import { v4 as uuidv4 } from 'uuid'

export async function getCustomCategories(customerId: string): Promise<CustomCategory[]> {
  const db = await connectDB()
  const categories = await db
    .collection('spending_categories')
    .find({ customerId })
    .sort({ createdAt: -1 })
    .toArray()
  
  return categories.map((cat: any) => ({
    id: cat.id || cat._id.toString(),
    customerId: cat.customerId,
    name: cat.name,
    keywords: cat.keywords || [],
    color: cat.color || '#6b7280',
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt
  }))
}

export async function getCustomCategory(customerId: string, id: string): Promise<CustomCategory | null> {
  const db = await connectDB()
  const category = await db
    .collection('spending_categories')
    .findOne({ customerId, id })
  
  if (!category) return null
  
  return {
    id: category.id || category._id.toString(),
    customerId: category.customerId,
    name: category.name,
    keywords: category.keywords || [],
    color: category.color || '#6b7280',
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  }
}

export async function createCustomCategory(
  customerId: string,
  input: CustomCategoryInput
): Promise<CustomCategory> {
  const db = await connectDB()
  const id = uuidv4()
  
  const category: CustomCategory = {
    id,
    customerId,
    name: input.name,
    keywords: input.keywords,
    color: input.color || '#6b7280',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await db.collection('spending_categories').insertOne(category)
  
  return category
}

export async function updateCustomCategory(
  customerId: string,
  id: string,
  input: Partial<CustomCategoryInput>
): Promise<boolean> {
  const db = await connectDB()
  
  const updateData: any = {
    updatedAt: new Date()
  }
  
  if (input.name) updateData.name = input.name
  if (input.keywords) updateData.keywords = input.keywords
  if (input.color) updateData.color = input.color
  
  const result = await db
    .collection('spending_categories')
    .updateOne(
      { customerId, id },
      { $set: updateData }
    )
  
  return result.matchedCount > 0
}

export async function deleteCustomCategory(customerId: string, id: string): Promise<boolean> {
  const db = await connectDB()
  
  const result = await db
    .collection('spending_categories')
    .deleteOne({ customerId, id })
  
  return result.deletedCount > 0
}
