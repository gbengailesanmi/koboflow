'use server'

import { actionFactory } from './factory.action'
import { deleteAccount } from '../../lib/server/api-service'

export async function deleteAccountAction() {
  return actionFactory({
    actionName: 'delete.account',
    handler: () => deleteAccount(),
    revalidate: [
      'session',
      'accounts',
      'transactions',
      'budget',
      'budgets',
      'settings',
      'categories',
      'sessions-list',
    ],
  })
}
