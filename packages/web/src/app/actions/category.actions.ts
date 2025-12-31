'use server'

import { actionFactory } from './factory.action'
import {
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '../../lib/server/api-service'
import type { CustomCategory } from '@money-mapper/shared'

export const categoryCreateAction = (
  data: { name: string; keywords: string[]; color?: string }
): Promise<CustomCategory | null> =>
  actionFactory({
    actionName: 'category.create',
    handler: () => createCustomCategory(data),
    revalidate: ['categories'],
  })

export const categoryUpdateAction = (
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
) =>
  actionFactory({
    actionName: 'category.update',
    handler: () => updateCustomCategory(categoryId, updates),
    revalidate: ['categories'],
  })

export const categoryDeleteAction = (categoryId: string) =>
  actionFactory({
    actionName: 'category.delete',
    handler: () => deleteCustomCategory(categoryId),
    revalidate: ['categories'],
  })
  