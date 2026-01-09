'use server'

import { actionFactory } from './factory.action'
import {
  createNewBudget,
  deleteBudgetById,
  patchBudget,
  updateBudgetById,
  setActiveBudget,
} from '../../lib/api/api-service'
import type { CategoryBudget, BudgetPeriod } from '@koboflow/shared'

export async function budgetCreateAction(
  name: string,
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod,
  setAsActive?: boolean
) {
  return actionFactory({
    actionName: 'budget.create',
    handler: () =>
      createNewBudget(name, totalBudgetLimit, categories, period, setAsActive),
    revalidate: ['budgets', 'budget'],
  })
}

export async function budgetUpdateAction(
  budgetId: string,
  updates: {
    name?: string
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
) {
  return actionFactory({
    actionName: 'budget.update',
    handler: () => updateBudgetById(budgetId, updates),
    revalidate: ['budgets', 'budget'],
  })
}

export async function budgetPatchAction(
  updates: {
    totalBudgetLimit?: number
    categories?: CategoryBudget[]
    period?: BudgetPeriod
  }
) {
  return actionFactory({
    actionName: 'budget.patch',
    handler: () => patchBudget(updates),
    revalidate: ['budget', 'session'],
  })
}

export async function budgetSetActiveAction(budgetId: string) {
  return actionFactory({
    actionName: 'budget.setActive',
    handler: () => setActiveBudget(budgetId),
    revalidate: ['budgets', 'budget'],
  })
}

export async function budgetDeleteAction(budgetId: string) {
  return actionFactory({
    actionName: 'budget.delete',
    handler: () => deleteBudgetById(budgetId),
    revalidate: ['budgets', 'budget'],
  })
}
