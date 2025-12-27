'use server'

import { revalidateTag } from 'next/cache'
import { createCustomCategory } from '../../lib/server/api-service'
import { CustomCategory } from '@money-mapper/shared'

/**
 * Server Action: Create custom category
 * Wraps the API service call with cache revalidation
 * Can be called directly from client components
 */
export async function createCustomCategoryAction(categoryData: {
  name: string
  keywords: string[]
  color?: string
}): Promise<CustomCategory | null> {
  try {
    const result = await createCustomCategory(categoryData)

    if (result) {
      revalidateTag('categories', 'fetch')
    }

    return result
  } catch (error: any) {
    console.error('createCustomCategoryAction error:', error)
    return null
  }
}
