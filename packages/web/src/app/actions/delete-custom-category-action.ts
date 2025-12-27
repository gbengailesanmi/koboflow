'use server'

import { revalidateTag } from 'next/cache'
import { deleteCustomCategory } from '../../lib/server/api-service'

/**
 * Server Action: Delete custom category
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function deleteCustomCategoryAction(categoryId: string): Promise<{ success: boolean }> {
  try {
    const result = await deleteCustomCategory(categoryId)

    if (result.success) {
      revalidateTag('categories', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('deleteCustomCategoryAction error:', error)
    return { success: false }
  }
}
