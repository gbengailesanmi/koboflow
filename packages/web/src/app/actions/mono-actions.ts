'use server'

import { actionFactory } from './factory.action'
import { logger } from '@koboflow/shared/utils'
import {
  exchangeMonoToken,
  importMonoAccount,
  syncMonoTransactions,
} from '@/lib/api/api-service'

/**
 * Mono: Connect account, import it, sync transactions
 */
export async function monoProcessConnectionAction(code: string) {
  return actionFactory({
    actionName: 'mono.processConnection',
    revalidatePaths: ['/[customerId]/dashboard', '/[customerId]/transactions'],
    handler: async () => {
      const tokenResult = await exchangeMonoToken(code)

      if (!tokenResult.success || !tokenResult.accountId) {
        return {
          success: false,
          message: tokenResult.message || 'Failed to exchange token',
        }
      }

      const accountId = tokenResult.accountId
      logger.info({ module: 'mono-action', accountId }, 'Token exchanged')

      const importResult = await importMonoAccount(accountId)

      if (!importResult.success) {
        return {
          success: false,
          message: importResult.message || 'Failed to import account',
        }
      }

      logger.info({ module: 'mono-action', accountId }, 'Account imported')

      const transactionsResult = await syncMonoTransactions(accountId)

      if (!transactionsResult.success) {
        logger.warn(
          {
            module: 'mono-action',
            accountId,
            message: transactionsResult.message,
          },
          'Transaction sync failed'
        )
      } else {
        logger.info(
          {
            module: 'mono-action',
            accountId,
            transactionsCount: transactionsResult.transactionsCount,
          },
          'Transactions synced'
        )
      }

      return {
        success: true,
        accountId,
        transactionsCount: transactionsResult.transactionsCount || 0,
        message: 'Account linked successfully',
      }
    },
  })
}
