// src/routes/mono.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import {
  exchangeToken,
  fetchAccountDetails,
  fetchAccountIdentity,
  fetchAllTransactions,
  formatAccountForStorage,
  normaliseTestAccountNumber,
} from '../services/mono'
import { bulkInsertAccounts } from '../db/helpers/insert-accounts'
import { bulkInsertTransactions } from '../db/helpers/insert-transactions'
import { updateCustomerDetailsFromMono } from '../db/helpers/update-customer-details-from-mono'
import { connectDB } from '../db/mongo'
import config from '../config'
import { logger } from '@koboflow/shared/utils'

export const monoRoutes = Router()

/* -------------------------------------------------------------------------- */
/* AUTH */
/* -------------------------------------------------------------------------- */

monoRoutes.post('/auth', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { code } = req.body
    if (!code) {
      return res.status(400).json({ success: false, error: 'Missing authorization code' })
    }

    const accountId = await exchangeToken(code)

    logger.info({ module: 'mono', customerId, accountId }, 'Token exchanged successfully')

    res.json({ success: true, accountId })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Token exchange failed')
    res.status(500).json({ success: false, error: 'Failed to exchange token', message: err.message })
  }
})

/* -------------------------------------------------------------------------- */
/* ACCOUNT DETAILS */
/* -------------------------------------------------------------------------- */

monoRoutes.get('/details/:accountId', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    const { realtime } = req.query

    const response = await fetchAccountDetails(accountId, realtime === 'true')

    res.json({ success: true, ...response })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Failed to fetch account details')
    res.status(500).json({ success: false, error: 'Failed to get account details', message: err.message })
  }
})

monoRoutes.get('/identity/:accountId', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    const identity = await fetchAccountIdentity(accountId)

    res.json({ success: true, data: identity })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Failed to fetch account identity')
    res.status(500).json({ success: false, error: 'Failed to get account identity', message: err.message })
  }
})

/* -------------------------------------------------------------------------- */
/* IMPORT ACCOUNT */
/* -------------------------------------------------------------------------- */

monoRoutes.post('/import/:accountId', requireAuth, async (req, res) => {
  const customerId = req.user?.customerId

  try {
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })

    let customerBVN: string | null = user?.customerDetailsFromMono?.bvn ?? null

    const identity = await fetchAccountIdentity(accountId)
    customerBVN = identity.bvn

    if (!user?.customerDetailsFromMono) {
      await updateCustomerDetailsFromMono(customerId, identity, connectDB)
    }

    const response = await fetchAccountDetails(accountId)
    const accountForStorage = formatAccountForStorage(response.data, customerId, customerBVN)

    if (customerBVN && accountForStorage.bvn && customerBVN.slice(-4) !== accountForStorage.bvn) {
      return res.status(400).json({
        success: false,
        error: 'Account BVN does not match customer BVN. Cannot link account.',
      })
    }

    await bulkInsertAccounts([accountForStorage], customerId, connectDB)

    res.json({ success: true, accountsCount: 1, account: accountForStorage })
  } catch (err: any) {
    logger.error({ module: 'mono', customerId, error: err.message }, 'Failed to import account')
    res.status(500).json({ success: false, error: 'Failed to import accounts', message: err.message })
  }
})

/* -------------------------------------------------------------------------- */
/* SYNC TRANSACTIONS */
/* -------------------------------------------------------------------------- */

monoRoutes.post('/sync-transactions/:accountId', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    const { accountId } = req.params
    const { start, end } = req.body ?? {}

    const options: any = {}
    if (start) options.start = new Date(start)
    if (end) options.end = new Date(end)

    const monoTransactions = await fetchAllTransactions(accountId, options)

    if (!monoTransactions.length) {
      return res.json({ success: true, transactionsCount: 0 })
    }

    await bulkInsertTransactions(monoTransactions, customerId!, accountId, connectDB)

    res.json({
      success: true,
      transactionsCount: monoTransactions.length,
      message: 'Transactions synced successfully',
    })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Failed to sync transactions')
    res.status(500).json({ success: false, error: 'Failed to sync transactions', message: err.message })
  }
})
