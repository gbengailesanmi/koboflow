'use server'

import { actionFactory } from './factory.action'
import { updateUserProfile, deleteAccount } from '../../lib/api/api-service'
import { logoutAllDevicesAction } from './session.actions'

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
  // ✅ Revoke all sessions before account deletion
  await logoutAllDevicesAction()
  
  return actionFactory({
    actionName: 'delete.user',
    handler: () => deleteAccount(),
    revalidate: [],
  })
}
