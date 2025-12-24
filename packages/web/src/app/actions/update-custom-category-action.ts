'use server'

import { revalidateTag } from 'next/cache'
import { updateCustomCategory } from '../api/api-service'

/**
 * Server Action: Update custom category
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function updateCustomCategoryAction(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
): Promise<{ success: boolean }> {
  try {
    const result = await updateCustomCategory(categoryId, updates)

    if (result.success) {
      revalidateTag('categories', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('updateCustomCategoryAction error:', error)
    return { success: false }
  }
}
