import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { getTinkTokens, getTinkAccountsData, getTinkTransactionsData } from '../services/tink'
import { bulkInsertTransactions } from '../db/helpers/insert-transactions'
import { bulkInsertAccounts } from '../db/helpers/insert-accounts'
import { connectDB } from '../db/mongo'

export const callbackRoutes = Router()

// Tink callback handler
callbackRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    // @ts-ignore - customerId is set by authMiddleware
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const code = req.query.code as string
    if (!code) {
      return res.status(400).json({ error: 'Missing code' })
    }

    const accessToken = await getTinkTokens({
      code,
      uriBase: process.env.BASE_URI || 'http://localhost',
      port: process.env.FRONTEND_PORT || '3000'
    })

    const accounts = await getTinkAccountsData(accessToken, customerId)
    const transactions = await getTinkTransactionsData(accessToken, accounts, customerId)

    await bulkInsertAccounts(accounts.accounts, customerId, connectDB)
    await bulkInsertTransactions(transactions.transactions, customerId, connectDB)

    res.json({
      success: true,
      message: 'Bank data imported successfully',
      accountsCount: accounts.accounts.length,
      transactionsCount: transactions.transactions.length
    })
  } catch (err) {
    console.error('Callback error:', err)
    res.status(500).json({ error: 'Failed to process bank data' })
  }
})
