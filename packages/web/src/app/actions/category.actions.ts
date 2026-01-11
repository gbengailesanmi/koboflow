'use server'

import { actionFactory } from './factory.action'
import {
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '../../lib/api/api-service'
import type { CustomCategory } from '@koboflow/shared'

export async function categoryCreateAction(
  data: { name: string; keywords: string[]; color?: string }
) {
  return actionFactory({
    actionName: 'category.create',
    handler: async () => {
      const category = await createCustomCategory(data)
      return {
        success: !!category,
        data: category,
      }
    },
  })
}

export async function categoryUpdateAction(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
) {
  return actionFactory({
    actionName: 'category.update',
    handler: async () => {
      const result = await updateCustomCategory(categoryId, updates)
      return result
    },
  })
}

export async function categoryDeleteAction(categoryId: string) {
  return actionFactory({
    actionName: 'category.delete',
    handler: async () => {
      const result = await deleteCustomCategory(categoryId)
      return result
    },
  })
}
  