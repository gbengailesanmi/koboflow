'use server'

import { actionFactory } from './factory.action'
import { logger } from '@money-mapper/shared/utils'
import {
  exchangeMonoToken,
  importMonoAccount,
  syncMonoTransactions,
  getMonoAccountIdentity,
  getCustomerDetailsFromMono,
} from '@/lib/server/api-service'

/**
 * Mono: Connect account, import it, sync transactions
 */
export const monoProcessConnectionAction = (code: string) =>
  actionFactory({
    actionName: 'mono.processConnection',
    revalidate: ['accounts', 'transactions', 'customer-details'],
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

/**
 * Mono: Fetch account identity
 */
export const monoFetchAccountIdentityAction = (accountId: string) =>
  actionFactory({
    actionName: 'mono.fetchAccountIdentity',
    handler: () => getMonoAccountIdentity(accountId),
  })

/**
 * Mono: Fetch customer details
 */
export const monoFetchCustomerDetailsAction = () =>
  actionFactory({
    actionName: 'mono.fetchCustomerDetails',
    handler: () => getCustomerDetailsFromMono(),
  })
  