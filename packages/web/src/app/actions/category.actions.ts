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
): Promise<CustomCategory | null> {
  return actionFactory({
    actionName: 'category.create',
    handler: () => createCustomCategory(data),
    revalidatePaths: ['/[customerId]/settings'],
  })
}

export async function categoryUpdateAction(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
) {
  return actionFactory({
    actionName: 'category.update',
    handler: () => updateCustomCategory(categoryId, updates),
    revalidatePaths: ['/[customerId]/settings'],
  })
}

export async function categoryDeleteAction(categoryId: string) {
  return actionFactory({
    actionName: 'category.delete',
    handler: () => deleteCustomCategory(categoryId),
    revalidatePaths: ['/[customerId]/settings'],
  })
}
  