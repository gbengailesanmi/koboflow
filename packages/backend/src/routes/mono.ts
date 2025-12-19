import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import {
  exchangeToken,
  fetchAccountDetails,
  fetchTransactions,
  formatAccountForStorage,
  fetchAllTransactions,
} from '../services/mono'
import { bulkInsertMonoAccounts } from '../db/helpers/insert-mono-accounts'
import { bulkInsertMonoTransactions } from '../db/helpers/insert-mono-transactions'
import { connectDB } from '../db/mongo'

export const monoRoutes = Router()

monoRoutes.post('/auth', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { code } = req.body
    if (!code) {
      return res.status(400).json({ success: false, error: 'Missing authorization code' })
    }

    console.log(`[Mono] Exchanging token for code: ${code}`)
    const accountId = await exchangeToken(code)
    
    console.log(`[Mono] Got account ID: ${accountId}`)
    res.json({ success: true, accountId })
  } catch (err: any) {
    console.error('[Mono] Token exchange error:', err)
    res.status(500).json({ success: false, error: 'Failed to exchange token', message: err.message })
  }
})

monoRoutes.get('/transactions/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    const { start, end, type, paginate, page } = req.query

    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    const transactions = await fetchTransactions(accountId, {
      start: start as string,
      end: end as string,
      type: type as 'debit' | 'credit',
      paginate: paginate === 'true',
      page: page ? parseInt(page as string) : undefined,
    })

    res.json({ success: true, transactions })
  } catch (err: any) {
    console.error('[Mono] Get transactions error:', err)
    res.status(500).json({ success: false, error: 'Failed to get transactions', message: err.message })
  }
})

monoRoutes.get('/details/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    const { realtime } = req.query
    
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    const response = await fetchAccountDetails(accountId, realtime === 'true')
    
    res.json({
      success: true,
      ...response,
    })
  } catch (err: any) {
    console.error('[Mono] Get details error:', err)
    res.status(500).json({ success: false, error: 'Failed to get account details', message: err.message })
  }
})

monoRoutes.post('/import/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    console.log(`[Mono] Importing account ${accountId}`)

    const response = await fetchAccountDetails(accountId)
    const accountForStorage = formatAccountForStorage(response.data, customerId)

    await bulkInsertMonoAccounts([accountForStorage], customerId, connectDB)

    console.log(`[Mono] Successfully imported account ${accountId}`)
    res.json({ 
      success: true, 
      accountsCount: 1,
      account: accountForStorage 
    })
  } catch (err: any) {
    console.error('[Mono] Import error:', err)
    res.status(500).json({ success: false, error: 'Failed to import accounts', message: err.message })
  }
})

monoRoutes.post('/sync-transactions/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    const { start, end } = req.body

    console.log(`[Mono] Syncing transactions for account ${accountId}`)

    const options: any = {}
    if (start) {
      options.start = new Date(start)
    }
    if (end) {
      options.end = new Date(end)
    }

    const monoTransactions = await fetchAllTransactions(accountId, options)

    if (!monoTransactions || monoTransactions.length === 0) {
      return res.json({ 
        success: true, 
        transactionsCount: 0, 
        message: 'No transactions found' 
      })
    }

    console.log(`[Mono] Fetched ${monoTransactions.length} transactions from Mono`)

    await bulkInsertMonoTransactions(monoTransactions, customerId, accountId, connectDB)

    console.log(`[Mono] Stored ${monoTransactions.length} transactions`)

    res.json({ 
      success: true, 
      transactionsCount: monoTransactions.length,
      message: 'Transactions synced successfully'
    })
  } catch (err: any) {
    console.error('[Mono] Sync transactions error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync transactions', 
      message: err.message 
    })
  }
})
