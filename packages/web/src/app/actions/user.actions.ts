'use server'

import { actionFactory } from './factory.action'
import { updateUserProfile } from '../../lib/server/api-service'
import { deleteAccount } from '../../lib/server/api-service'

export async function userUpdateProfileAction(
  customerId: string,
  updates: {
    firstName?: string
    lastName?: string
    email?: string
    totalBudgetLimit?: number
  }
) {
  return actionFactory({
    actionName: 'user.updateProfile',
    handler: () => updateUserProfile(customerId, updates),
    revalidate:
      updates.totalBudgetLimit !== undefined
        ? ['session', 'budget', 'budgets']
        : ['session'],
  })
}


export async function deleteUserAction() {
  return actionFactory({
    actionName: 'delete.user',
    handler: () => deleteAccount(),
    revalidate: [],
  })
}
