// filepath: /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/backend/src/routes/mono.ts
/**
 * Mono Connect Routes
 * Handles all Mono API interactions for bank account linking
 */

import { Router } from 'express'
import crypto from 'crypto'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import {
  // Authorisation
  initiateAccountLinking,
  initiateAccountReauth,
  exchangeToken,
  // Account
  getAccountDetails,
  getAccountIdentity,
  getAccountBalance,
  unlinkAccount,
  getCreditWorthiness,
  // Transactions
  getTransactions,
  getAllTransactions,
  // Statements
  getAccountStatement,
  getStatementJobStatus,
  // Investments
  getAccountEarnings,
  getAccountAssets,
  // Enrichment
  getTransactionCategorisation,
  getStatementInsights,
  // Sync
  syncAccount,
  // Helpers
  listAllAccounts,
  getAccountsByCustomerId,
  formatAccountForStorage,
  formatTransactionsForStorage,
  formatDate,
} from '../services/mono'
import { bulkInsertMonoAccounts } from '../db/helpers/insert-mono-accounts'
import { bulkInsertMonoTransactions } from '../db/helpers/insert-mono-transactions'
import { connectDB } from '../db/mongo'
import config from '../config'

export const monoRoutes = Router()

// ============================================================================
// Configuration
// ============================================================================

/**
 * GET /api/mono/config
 * Returns the Mono public key for the Connect widget
 */
monoRoutes.get('/config', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      publicKey: config.MONO_PUBLIC_KEY,
    })
  } catch (error) {
    console.error('[Mono] Get config error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get Mono configuration',
    })
  }
})

// ============================================================================
// Account Connection (Mono Connect Widget Flow)
// ============================================================================

/**
 * POST /api/mono/connect
 * Exchange code from Mono Connect widget for account data and transactions
 */
monoRoutes.post('/connect', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing code from Mono Connect',
      })
    }

    console.log('[Mono] Exchanging code for account ID...')

    // Step 1: Exchange code for account ID
    const accountId = await exchangeToken(code)
    console.log('[Mono] Got account ID:', accountId)

    // Step 2: Get account details
    const accountDetails = await getAccountDetails(accountId)
    console.log('[Mono] Got account details:', accountDetails.name, accountDetails.institution?.name)

    // Step 3: Format account for storage
    const formattedAccount = formatAccountForStorage(accountDetails, customerId)

    // Step 4: Store account in database
    await bulkInsertMonoAccounts([formattedAccount], customerId, connectDB)
    console.log('[Mono] Account stored in database')

    // Step 5: Fetch transactions (last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    console.log('[Mono] Fetching transactions...')
    const transactions = await getAllTransactions(accountId, {
      start: oneYearAgo,
      end: new Date(),
    })
    console.log('[Mono] Fetched', transactions.length, 'transactions')

    // Step 6: Format and store transactions
    if (transactions.length > 0) {
      const formattedTransactions = formatTransactionsForStorage(
        transactions,
        accountId,
        formattedAccount.uniqueId,
        customerId
      )
      await bulkInsertMonoTransactions(formattedTransactions, customerId, connectDB)
      console.log('[Mono] Transactions stored in database')
    }

    res.json({
      success: true,
      message: 'Bank account connected successfully',
      accountsCount: 1,
      transactionsCount: transactions.length,
      account: {
        id: accountId,
        name: formattedAccount.name,
        institution: formattedAccount.institution.name,
        type: formattedAccount.type,
        accountNumber: formattedAccount.accountNumber,
        balance: formattedAccount.balance,
        currency: formattedAccount.currency,
      },
    })
  } catch (err: any) {
    console.error('[Mono] Connect error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to connect bank account',
      message: err.message,
    })
  }
})

// ============================================================================
// Account Linking (Direct API Flow)
// ============================================================================

/**
 * POST /api/mono/link
 * Link an existing Mono account directly by account ID
 */
monoRoutes.post('/link', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { monoAccountId } = req.body

    if (!monoAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Mono Account ID',
      })
    }

    console.log('[Mono] Linking account:', monoAccountId)

    // Get account details
    const accountDetails = await getAccountDetails(monoAccountId)
    console.log('[Mono] Got account details:', accountDetails.name, accountDetails.institution?.name)

    // Format and store account
    const formattedAccount = formatAccountForStorage(accountDetails, customerId)
    await bulkInsertMonoAccounts([formattedAccount], customerId, connectDB)

    // Fetch transactions (last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    console.log('[Mono] Fetching transactions...')
    const transactions = await getAllTransactions(monoAccountId, {
      start: oneYearAgo,
      end: new Date(),
    })
    console.log('[Mono] Fetched', transactions.length, 'transactions')

    // Store transactions
    if (transactions.length > 0) {
      const formattedTransactions = formatTransactionsForStorage(
        transactions,
        monoAccountId,
        formattedAccount.uniqueId,
        customerId
      )
      await bulkInsertMonoTransactions(formattedTransactions, customerId, connectDB)
    }

    res.json({
      success: true,
      message: 'Bank account linked successfully',
      accountsCount: 1,
      transactionsCount: transactions.length,
      account: {
        id: monoAccountId,
        name: formattedAccount.name,
        institution: formattedAccount.institution.name,
        type: formattedAccount.type,
        balance: formattedAccount.balance,
      },
    })
  } catch (err: any) {
    console.error('[Mono] Link error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to link bank account',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/link-all
 * Link all accounts from Mono
 */
monoRoutes.post('/link-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    console.log('[Mono] Fetching all linked accounts...')

    // Get all accounts from Mono
    const accounts = await listAllAccounts()
    console.log('[Mono] Found', accounts.length, 'accounts')

    if (accounts.length === 0) {
      return res.json({
        success: true,
        message: 'No accounts found to link',
        accountsCount: 0,
        transactionsCount: 0,
        accounts: [],
      })
    }

    let totalTransactions = 0
    const linkedAccounts: any[] = []

    // Process each account
    for (const accountDetails of accounts) {
      console.log('[Mono] Processing account:', accountDetails.id, accountDetails.name)

      // Format and store account
      const formattedAccount = formatAccountForStorage(accountDetails, customerId)
      await bulkInsertMonoAccounts([formattedAccount], customerId, connectDB)

      // Fetch transactions
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      try {
        const transactions = await getAllTransactions(accountDetails.id, {
          start: oneYearAgo,
          end: new Date(),
        })

        if (transactions.length > 0) {
          const formattedTransactions = formatTransactionsForStorage(
            transactions,
            accountDetails.id,
            formattedAccount.uniqueId,
            customerId
          )
          await bulkInsertMonoTransactions(formattedTransactions, customerId, connectDB)
          totalTransactions += transactions.length
        }

        linkedAccounts.push({
          id: accountDetails.id,
          name: formattedAccount.name,
          institution: formattedAccount.institution.name,
          transactionsCount: transactions.length,
        })
      } catch (txnErr: any) {
        console.error('[Mono] Error fetching transactions for', accountDetails.id, ':', txnErr.message)
        linkedAccounts.push({
          id: accountDetails.id,
          name: formattedAccount.name,
          institution: formattedAccount.institution.name,
          transactionsCount: 0,
          error: txnErr.message,
        })
      }
    }

    res.json({
      success: true,
      message: 'All accounts linked successfully',
      accountsCount: linkedAccounts.length,
      transactionsCount: totalTransactions,
      accounts: linkedAccounts,
    })
  } catch (err: any) {
    console.error('[Mono] Link all error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to link accounts',
      message: err.message,
    })
  }
})

// ============================================================================
// Account Management
// ============================================================================

/**
 * GET /api/mono/accounts
 * Get all user's linked accounts from our database
 */
monoRoutes.get('/accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const db = await connectDB()
    const accounts = await db
      .collection('accounts')
      .find({ customerId, provider: 'mono' })
      .toArray()

    res.json({
      success: true,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        accountNumber: acc.accountNumber,
        balance: acc.balance,
        currency: acc.currency,
        institution: acc.institution,
        lastRefreshed: acc.lastRefreshed,
      })),
    })
  } catch (err: any) {
    console.error('[Mono] Get accounts error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get accounts',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/sync/:accountId
 * Manually trigger a sync for a Mono account
 */
monoRoutes.post('/sync/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify the account belongs to this customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Trigger sync with Mono
    const syncResult = await syncAccount(accountId)

    res.json({
      success: true,
      message: 'Account sync initiated',
      status: syncResult.status,
    })
  } catch (err: any) {
    console.error('[Mono] Sync error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to sync account',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/refresh/:accountId
 * Refresh account balance and transactions
 */
monoRoutes.post('/refresh/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify the account belongs to this customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Get fresh account details and balance
    const accountDetails = await getAccountDetails(accountId)
    const formattedAccount = formatAccountForStorage(accountDetails, customerId)

    // Update account in database
    await db.collection('accounts').updateOne(
      { id: accountId, customerId },
      {
        $set: {
          balance: formattedAccount.balance,
          balanceRaw: formattedAccount.balanceRaw,
          lastRefreshed: new Date(),
        },
      }
    )

    // Fetch new transactions (last 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const transactions = await getAllTransactions(accountId, {
      start: threeMonthsAgo,
      end: new Date(),
    })

    // Store new transactions (duplicates will be ignored)
    if (transactions.length > 0) {
      const formattedTransactions = formatTransactionsForStorage(
        transactions,
        accountId,
        account.uniqueId,
        customerId
      )
      await bulkInsertMonoTransactions(formattedTransactions, customerId, connectDB)
    }

    res.json({
      success: true,
      message: 'Account refreshed',
      balance: formattedAccount.balance,
      transactionsCount: transactions.length,
    })
  } catch (err: any) {
    console.error('[Mono] Refresh error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh account',
      message: err.message,
    })
  }
})

/**
 * GET /api/mono/balance/:accountId
 * Get real-time balance for an account
 */
monoRoutes.get('/balance/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify the account belongs to this customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Get real-time balance from Mono
    const balance = await getAccountBalance(accountId, true)

    res.json({
      success: true,
      balance: {
        available: (balance.available_balance / 100).toFixed(2),
        ledger: (balance.ledger_balance / 100).toFixed(2),
        currency: balance.currency,
      },
    })
  } catch (err: any) {
    console.error('[Mono] Get balance error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      message: err.message,
    })
  }
})

/**
 * DELETE /api/mono/unlink/:accountId
 * Unlink a Mono account
 */
monoRoutes.delete('/unlink/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify the account belongs to this customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Unlink from Mono
    try {
      await unlinkAccount(accountId)
    } catch (unlinkErr: any) {
      console.warn('[Mono] Unlink API error (continuing anyway):', unlinkErr.message)
    }

    // Remove from our database
    await db.collection('accounts').deleteOne({ id: accountId, customerId })
    await db.collection('transactions').deleteMany({ accountId, customerId })

    res.json({
      success: true,
      message: 'Account unlinked successfully',
    })
  } catch (err: any) {
    console.error('[Mono] Unlink error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to unlink account',
      message: err.message,
    })
  }
})

// ============================================================================
// Authorisation Endpoints
// ============================================================================

/**
 * POST /api/mono/initiate
 * Initiate account linking (programmatic alternative to widget)
 */
monoRoutes.post('/initiate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { customer, redirectUrl, meta } = req.body

    if (!customer?.name || !customer?.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer name or email',
      })
    }

    if (!redirectUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing redirect URL',
      })
    }

    const result = await initiateAccountLinking(customer, redirectUrl, meta)

    res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[Mono] Initiate error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate account linking',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/reauth
 * Initiate account reauthorization
 */
monoRoutes.post('/reauth', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId, redirectUrl, meta } = req.body

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing account ID',
      })
    }

    if (!redirectUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing redirect URL',
      })
    }

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const result = await initiateAccountReauth(accountId, redirectUrl, meta)

    res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[Mono] Reauth error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate reauthorization',
      message: err.message,
    })
  }
})

// ============================================================================
// Identity Endpoints
// ============================================================================

/**
 * GET /api/mono/identity/:accountId
 * Get account identity information (KYC data)
 */
monoRoutes.get('/identity/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const identity = await getAccountIdentity(accountId)

    res.json({
      success: true,
      data: identity,
    })
  } catch (err: any) {
    console.error('[Mono] Get identity error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get account identity',
      message: err.message,
    })
  }
})

// ============================================================================
// Creditworthiness Endpoints
// ============================================================================

/**
 * POST /api/mono/creditworthiness/:accountId
 * Get creditworthiness assessment for an account
 */
monoRoutes.post('/creditworthiness/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params
    const creditData = req.body

    if (!creditData.bvn || !creditData.principal || !creditData.interest_rate || !creditData.term) {
      return res.status(400).json({
        success: false,
        error: 'Missing required credit assessment parameters',
      })
    }

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const result = await getCreditWorthiness(accountId, creditData)

    res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[Mono] Creditworthiness error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get creditworthiness',
      message: err.message,
    })
  }
})

// ============================================================================
// Transaction Endpoints
// ============================================================================

/**
 * GET /api/mono/transactions/:accountId
 * Get transactions for an account with filters
 */
monoRoutes.get('/transactions/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params
    const { start, end, narration, type, paginate, page } = req.query

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const transactions = await getTransactions(accountId, {
      start: start as string,
      end: end as string,
      narration: narration as string,
      type: type as 'debit' | 'credit',
      paginate: paginate === 'true',
      page: page ? parseInt(page as string) : undefined,
    })

    res.json({
      success: true,
      data: transactions,
    })
  } catch (err: any) {
    console.error('[Mono] Get transactions error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      message: err.message,
    })
  }
})

// ============================================================================
// Statement Endpoints
// ============================================================================

/**
 * GET /api/mono/statement/:accountId
 * Get account statement (PDF or JSON)
 */
monoRoutes.get('/statement/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params
    const { period, output } = req.query

    if (!period) {
      return res.status(400).json({
        success: false,
        error: 'Missing period parameter (last1month, last2months, last3months, last6months, last12months)',
      })
    }

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const statement = await getAccountStatement(accountId, {
      period: period as any,
      output: output as 'json' | 'pdf',
    })

    res.json({
      success: true,
      data: statement,
    })
  } catch (err: any) {
    console.error('[Mono] Get statement error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get statement',
      message: err.message,
    })
  }
})

/**
 * GET /api/mono/statement/:accountId/job/:jobId
 * Get statement job status (for async PDF generation)
 */
monoRoutes.get('/statement/:accountId/job/:jobId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId, jobId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const status = await getStatementJobStatus(accountId, jobId)

    res.json({
      success: true,
      data: status,
    })
  } catch (err: any) {
    console.error('[Mono] Get statement job status error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get statement job status',
      message: err.message,
    })
  }
})

// ============================================================================
// Investment Endpoints
// ============================================================================

/**
 * GET /api/mono/earnings/:accountId
 * Get earnings from investment accounts
 */
monoRoutes.get('/earnings/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const earnings = await getAccountEarnings(accountId)

    res.json({
      success: true,
      data: earnings,
    })
  } catch (err: any) {
    console.error('[Mono] Get earnings error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings',
      message: err.message,
    })
  }
})

/**
 * GET /api/mono/assets/:accountId
 * Get assets from investment accounts
 */
monoRoutes.get('/assets/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const assets = await getAccountAssets(accountId)

    res.json({
      success: true,
      data: assets,
    })
  } catch (err: any) {
    console.error('[Mono] Get assets error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get assets',
      message: err.message,
    })
  }
})

// ============================================================================
// Data Enrichment Endpoints
// ============================================================================

/**
 * GET /api/mono/categorisation/:accountId
 * Get transaction categorisation/enrichment
 */
monoRoutes.get('/categorisation/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const categorisation = await getTransactionCategorisation(accountId)

    res.json({
      success: true,
      data: categorisation,
    })
  } catch (err: any) {
    console.error('[Mono] Get categorisation error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction categorisation',
      message: err.message,
    })
  }
})

/**
 * GET /api/mono/insights/:accountId
 * Get statement insights/analytics
 */
monoRoutes.get('/insights/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { accountId } = req.params

    // Verify account belongs to customer
    const db = await connectDB()
    const account = await db.collection('accounts').findOne({
      id: accountId,
      customerId,
      provider: 'mono',
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    const insights = await getStatementInsights(accountId)

    res.json({
      success: true,
      data: insights,
    })
  } catch (err: any) {
    console.error('[Mono] Get insights error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get statement insights',
      message: err.message,
    })
  }
})

// ============================================================================
// Customer Accounts Endpoints
// ============================================================================

/**
 * GET /api/mono/customer/:monoCustomerId/accounts
 * Get all accounts for a specific Mono customer
 */
monoRoutes.get('/customer/:monoCustomerId/accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { monoCustomerId } = req.params

    const accounts = await getAccountsByCustomerId(monoCustomerId)

    res.json({
      success: true,
      data: accounts,
    })
  } catch (err: any) {
    console.error('[Mono] Get customer accounts error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get customer accounts',
      message: err.message,
    })
  }
})

/**
 * GET /api/mono/all-accounts
 * Get all accounts from Mono (admin/debug endpoint)
 */
monoRoutes.get('/all-accounts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const accounts = await listAllAccounts()

    res.json({
      success: true,
      count: accounts.length,
      data: accounts,
    })
  } catch (err: any) {
    console.error('[Mono] List all accounts error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to list all accounts',
      message: err.message,
    })
  }
})

// ============================================================================
// Webhooks
// ============================================================================

/**
 * Webhook event types from Mono
 */
interface MonoWebhookEvent {
  event: string
  data: {
    account?: string  // Account ID
    meta?: {
      data_status?: string
      auth_method?: string
    }
  }
}

/**
 * Verify Mono webhook signature
 * Mono sends a SHA-512 HMAC signature in the 'mono-webhook-sec' header
 * 
 * @param payload - The raw request body as a string
 * @param signature - The signature from 'mono-webhook-sec' header
 * @returns true if signature is valid
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!config.MONO_WEBHOOK_SECRET) {
    console.warn('[Mono Webhook] MONO_WEBHOOK_SECRET not configured - skipping signature verification')
    return true // Allow in development if not configured
  }

  const expectedSignature = crypto
    .createHmac('sha512', config.MONO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (err) {
    // Buffers have different lengths = invalid signature
    return false
  }
}

/**
 * Helper: Refresh account data after webhook event
 */
async function refreshAccountFromWebhook(monoAccountId: string) {
  try {
    const db = await connectDB()
    
    // Find the account in our database
    const account = await db.collection('accounts').findOne({
      id: monoAccountId,
      provider: 'mono',
    })

    if (!account) {
      console.log('[Mono Webhook] Account not found in database:', monoAccountId)
      return
    }

    console.log('[Mono Webhook] Refreshing account:', monoAccountId)

    // Get fresh account details
    const accountDetails = await getAccountDetails(monoAccountId)
    const formattedAccount = formatAccountForStorage(accountDetails, account.customerId)

    // Update account in database
    await db.collection('accounts').updateOne(
      { id: monoAccountId },
      {
        $set: {
          balance: formattedAccount.balance,
          balanceRaw: formattedAccount.balanceRaw,
          status: formattedAccount.status,
          lastRefreshed: new Date(),
        },
      }
    )

    // Fetch new transactions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const transactions = await getAllTransactions(monoAccountId, {
      start: thirtyDaysAgo,
      end: new Date(),
    })

    if (transactions.length > 0) {
      const formattedTransactions = formatTransactionsForStorage(
        transactions,
        monoAccountId,
        account.uniqueId,
        account.customerId
      )
      await bulkInsertMonoTransactions(formattedTransactions, account.customerId, connectDB)
    }

    console.log('[Mono Webhook] Account refreshed:', monoAccountId, '- Transactions:', transactions.length)
  } catch (err: any) {
    console.error('[Mono Webhook] Error refreshing account:', err.message)
  }
}

/**
 * Helper: Store notification for user
 */
async function storeNotification(
  customerId: string,
  type: 'info' | 'warning' | 'error' | 'success',
  title: string,
  message: string,
  metadata?: any
) {
  try {
    const db = await connectDB()
    
    await db.collection('notifications').insertOne({
      customerId,
      type,
      title,
      message,
      metadata,
      read: false,
      createdAt: new Date(),
    })

    console.log('[Mono Webhook] Notification stored for customer:', customerId)
  } catch (err: any) {
    console.error('[Mono Webhook] Error storing notification:', err.message)
  }
}

/**
 * POST /api/mono/webhook
 * Handle Mono webhooks for real-time updates
 * 
 * Events:
 * - mono.events.account_updated: Account data refreshed
 * - mono.events.account_connected: New account linked
 * - mono.events.account_reauthorization_required: Re-auth needed
 * - mono.events.account_reauthorised: Re-auth completed
 * 
 * Security:
 * - Verifies webhook signature using MONO_WEBHOOK_SECRET
 * - Signature is in 'mono-webhook-sec' header (SHA-512 HMAC)
 */
monoRoutes.post('/webhook', async (req, res) => {
  try {
    // Get the raw body for signature verification (set by middleware in index.ts)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body)
    const signature = req.headers['mono-webhook-sec'] as string

    // Verify webhook signature
    if (config.MONO_WEBHOOK_SECRET && !signature) {
      console.error('[Mono Webhook] Missing webhook signature')
      return res.status(401).json({ error: 'Missing webhook signature' })
    }

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.error('[Mono Webhook] Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }

    const event: MonoWebhookEvent = req.body

    console.log('[Mono Webhook] Verified event:', event.event, JSON.stringify(event.data))

    const monoAccountId = event.data?.account

    switch (event.event) {
      case 'mono.events.account_updated': {
        // Account data has been updated - refresh our stored data
        if (monoAccountId) {
          await refreshAccountFromWebhook(monoAccountId)
          
          // Find customer to notify
          const db = await connectDB()
          const account = await db.collection('accounts').findOne({ id: monoAccountId })
          
          if (account) {
            await storeNotification(
              account.customerId,
              'info',
              'Account Updated',
              `Your ${account.institution?.name || 'bank'} account has been synced with new data.`,
              { accountId: monoAccountId, event: 'account_updated' }
            )
          }
        }
        break
      }

      case 'mono.events.account_connected': {
        // New account connected - this usually happens after widget flow
        // The /connect endpoint handles initial data fetch, but we can refresh here too
        console.log('[Mono Webhook] New account connected:', monoAccountId)
        
        if (monoAccountId) {
          // Give a moment for the /connect endpoint to finish first
          setTimeout(() => refreshAccountFromWebhook(monoAccountId), 5000)
        }
        break
      }

      case 'mono.events.account_reauthorization_required': {
        // User needs to reauthorize - CRITICAL notification
        if (monoAccountId) {
          const db = await connectDB()
          const account = await db.collection('accounts').findOne({ id: monoAccountId })
          
          if (account) {
            // Update account status
            await db.collection('accounts').updateOne(
              { id: monoAccountId },
              {
                $set: {
                  status: 'REAUTHORIZATION_REQUIRED',
                  reauthorizationRequiredAt: new Date(),
                },
              }
            )

            // Store urgent notification
            await storeNotification(
              account.customerId,
              'warning',
              'Bank Reconnection Required',
              `Your ${account.institution?.name || 'bank'} account needs to be reconnected. Please re-link your account to continue syncing transactions.`,
              { accountId: monoAccountId, event: 'reauthorization_required', urgent: true }
            )
          }
        }
        break
      }

      case 'mono.events.account_reauthorised': {
        // Account reauthorized successfully - refresh data
        if (monoAccountId) {
          const db = await connectDB()
          
          // Update account status
          await db.collection('accounts').updateOne(
            { id: monoAccountId },
            {
              $set: {
                status: 'ACTIVE',
                reauthorizedAt: new Date(),
              },
              $unset: {
                reauthorizationRequiredAt: '',
              },
            }
          )

          // Refresh account data
          await refreshAccountFromWebhook(monoAccountId)

          const account = await db.collection('accounts').findOne({ id: monoAccountId })
          
          if (account) {
            await storeNotification(
              account.customerId,
              'success',
              'Account Reconnected',
              `Your ${account.institution?.name || 'bank'} account has been successfully reconnected.`,
              { accountId: monoAccountId, event: 'account_reauthorised' }
            )
          }
        }
        break
      }

      default:
        console.log('[Mono Webhook] Unhandled event:', event.event)
    }

    // Always respond quickly to webhook
    res.json({ received: true })
  } catch (err: any) {
    console.error('[Mono Webhook] Error:', err)
    // Still return 200 to prevent Mono from retrying
    res.json({ received: true, error: err.message })
  }
})

// ============================================================================
// Notifications Endpoints
// ============================================================================

/**
 * GET /api/mono/notifications
 * Get user's notifications
 */
monoRoutes.get('/notifications', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { unreadOnly } = req.query

    const db = await connectDB()
    const query: any = { customerId }
    
    if (unreadOnly === 'true') {
      query.read = false
    }

    const notifications = await db
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    res.json({
      success: true,
      data: notifications,
    })
  } catch (err: any) {
    console.error('[Mono] Get notifications error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/notifications/:notificationId/read
 * Mark notification as read
 */
monoRoutes.post('/notifications/:notificationId/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { notificationId } = req.params

    const db = await connectDB()
    const { ObjectId } = await import('mongodb')

    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId), customerId },
      { $set: { read: true, readAt: new Date() } }
    )

    res.json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (err: any) {
    console.error('[Mono] Mark notification read error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: err.message,
    })
  }
})

/**
 * POST /api/mono/notifications/read-all
 * Mark all notifications as read
 */
monoRoutes.post('/notifications/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const db = await connectDB()

    const result = await db.collection('notifications').updateMany(
      { customerId, read: false },
      { $set: { read: true, readAt: new Date() } }
    )

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount,
    })
  } catch (err: any) {
    console.error('[Mono] Mark all notifications read error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      message: err.message,
    })
  }
})
