'use server'

import { actionFactory } from './factory.action'
import {
  createNewBudget,
  deleteBudgetById,
  patchBudget,
  updateBudgetById,
  setActiveBudget,
} from '../../lib/server/api-service'
import type { CategoryBudget, BudgetPeriod } from '@money-mapper/shared'

export const budgetCreateAction = (
  name: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod,
  setAsActive?: boolean
) =>
  actionFactory({
    actionName: 'budget.create',
    handler: () =>
      createNewBudget(name, totalBudgetLimit, categories, period, setAsActive),
    revalidate: ['budgets', 'budget'],
  })

export const budgetUpdateAction = (
  budgetId: string,
  updates: {
    name?: string
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
) =>
  actionFactory({
    actionName: 'budget.update',
    handler: () => updateBudgetById(budgetId, updates),
    revalidate: ['budgets', 'budget'],
  })

export const budgetPatchAction = (
  updates: {
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
) =>
  actionFactory({
    actionName: 'budget.patch',
    handler: () => patchBudget(updates),
    revalidate: ['budget', 'session'],
  })

export const budgetSetActiveAction = (budgetId: string) =>
  actionFactory({
    actionName: 'budget.setActive',
    handler: () => setActiveBudget(budgetId),
    revalidate: ['budgets', 'budget'],
  })

export const budgetDeleteAction = (budgetId: string) =>
  actionFactory({
    actionName: 'budget.delete',
    handler: () => deleteBudgetById(budgetId),
    revalidate: ['budgets', 'budget'],
  })
  