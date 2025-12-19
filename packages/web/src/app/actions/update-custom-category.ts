'use server'

import { revalidatePath } from 'next/cache'
import { updateCustomCategory as updateCategoryService } from '../api/api-service'

/**
 * Server Action to update a custom category
 * This runs on the server, so it can access the backend directly
 */
export async function updateCategoryAction(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateCategoryService(categoryId, updates)
    
    if (result.success) {
      revalidatePath('/[customerId]/analytics', 'page')
      return { success: true }
    }
    
    return { success: false, error: 'Update failed' }
  } catch (error: any) {
    console.error('[Category Action] Update failed:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to update category'
    }
  }
}
