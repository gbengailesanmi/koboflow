// /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/backend/src/routes/mono.ts
import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import {
  exchangeToken,
  fetchAccountDetails,
  fetchAccountIdentity,
  fetchTransactions,
  formatAccountForStorage,
  fetchAllTransactions,
  normaliseTestAccountNumber,
  syncAccount,
} from '../services/mono'
import { bulkInsertAccounts } from '../db/helpers/insert-accounts'
import { bulkInsertTransactions } from '../db/helpers/insert-transactions'
import { updateCustomerDetailsFromMono } from '../db/helpers/update-customer-details-from-mono'
import { connectDB } from '../db/mongo'
import config from '../config'
import { logger } from '@money-mapper/shared/utils'

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
    
    const accountId = await exchangeToken(code)
    console.log('codecdecdece', code, accountId)

    logger.info({ module: 'mono', customerId, accountId }, 'Token exchanged successfully')
    logger.info({
      module: 'mono',
      body: req.body,
      headers: req.headers['content-type'],
    }, 'Mono auth request received')

    res.json({ success: true, accountId })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Token exchange failed')
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
    logger.error({ module: 'mono', error: err.message }, 'Failed to fetch transactions')
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
    logger.error({ module: 'mono', error: err.message }, 'Failed to fetch account details')
    res.status(500).json({ success: false, error: 'Failed to get account details', message: err.message })
  }
})

monoRoutes.get('/identity/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    const identity = await fetchAccountIdentity(accountId)
    
    res.json({
      success: true,
      data: identity,
    })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Failed to fetch account identity')
    res.status(500).json({ success: false, error: 'Failed to get account identity', message: err.message })
  }
})

// Debug endpoint: Get account normalization info (test mode only)
monoRoutes.get('/debug/account/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (config.IS_PRODUCTION) {
      return res.status(403).json({ 
        success: false, 
        error: 'Debug endpoints not available in production' 
      })
    }

    const customerId = req.user?.customerId
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    // Fetch from Mono
    const monoResponse = await fetchAccountDetails(accountId)
    const monoAccount = monoResponse.data.account

    // Fetch from our DB
    const db = await connectDB()
    const storedAccount = await db.collection('accounts').findOne({ 
      customerId,
      id: accountId 
    })

    res.json({
      success: true,
      debug: {
        mono: {
          account_number: monoAccount.account_number,
          bank_code: monoAccount.institution.bank_code,
          bank_name: monoAccount.institution.name,
          bvn: monoAccount.bvn
        },
        stored: storedAccount ? {
          account_number: storedAccount.account_number,
          bank_code: storedAccount.institution.bank_code,
          bank_name: storedAccount.institution.name,
          bvn: storedAccount.bvn,
          is_normalized: storedAccount.account_number.includes('-')
        } : null,
        normalization: {
          enabled: !config.IS_PRODUCTION,
          original: monoAccount.account_number,
          normalized: normaliseTestAccountNumber(
            monoAccount.account_number,
            monoAccount.institution.bank_code
          )
        }
      }
    })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Debug endpoint error')
    res.status(500).json({ success: false, error: err.message })
  }
})

monoRoutes.post('/import/:accountId', authMiddleware, async (req: AuthRequest, res) => {
  const customerId = req.user?.customerId
  
  try {
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { accountId } = req.params
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing accountId' })
    }

    // Step 1: Fetch identity data first (contains customer info including BVN)
    let identity
    let customerBVN: string | null = null
    
    // First check if customer already has details stored
    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    const hasExistingDetails = !!user?.customerDetailsFromMono
    
    try {
      identity = await fetchAccountIdentity(accountId)
      customerBVN = identity.bvn
      
      // Step 2: Update customer details in users collection ONLY if this is the FIRST account
      if (!hasExistingDetails) {
        await updateCustomerDetailsFromMono(customerId, identity, connectDB)
        logger.info({ module: 'mono', customerId, accountId }, 'Customer details updated (first account)')
      } else {
        // Use existing BVN from user document
        customerBVN = user.customerDetailsFromMono.bvn
        logger.info({ module: 'mono', customerId, accountId }, 'Using existing customer details')
      }
    } catch (err: any) {
      logger.warn({ module: 'mono', customerId, accountId, error: err.message }, 'Failed to fetch/update identity')
      // Continue without identity data - some accounts may not have it
      // But try to get existing BVN from user document
      if (user?.customerDetailsFromMono?.bvn) {
        customerBVN = user.customerDetailsFromMono.bvn
      }
    }

    // Step 3: Fetch account details
    const response = await fetchAccountDetails(accountId)
    
    // Step 4: Format account for storage (applies test normalizations)
    // In test mode, account BVN will be normalized to last 4 digits of identity BVN
    // In production, account BVN already comes as last 4 digits
    const accountForStorage = formatAccountForStorage(response.data, customerId, customerBVN)
    
    // Step 5: Validate BVN consistency BEFORE storing
    // The identity BVN (from users.customerDetailsFromMono) is the source of truth
    // All accounts linked to this customer must match this BVN
    const storedAccountBVN = accountForStorage.bvn
    const customerBVNLast4 = customerBVN ? customerBVN.slice(-4) : null
    
    if (customerBVNLast4 && storedAccountBVN) {
      if (customerBVNLast4 !== storedAccountBVN) {
        logger.error({ 
          module: 'mono', 
          customerId, 
          accountId,
          customerBVN: customerBVNLast4, 
          accountBVN: storedAccountBVN 
        }, 'BVN mismatch - cannot link account')
        
        return res.status(400).json({ 
          success: false, 
          error: 'Account BVN does not match customer BVN. Cannot link account.' 
        })
      }
      logger.info({ module: 'mono', customerId, accountId, bvn: storedAccountBVN }, 'BVN validation passed')
    } else if (!storedAccountBVN) {
      logger.warn({ module: 'mono', customerId, accountId }, 'Account has no BVN, skipping validation')
    } else if (!customerBVN) {
      logger.warn({ module: 'mono', customerId, accountId }, 'Customer has no BVN on record, skipping validation')
    }
    
    // Step 6: Store account ONLY after BVN validation passes
    await bulkInsertAccounts([accountForStorage], customerId, connectDB)

    logger.info({ module: 'mono', customerId, accountId }, 'Account imported successfully')
    res.json({ 
      success: true, 
      accountsCount: 1,
      account: accountForStorage 
    })
  } catch (err: any) {
    logger.error({ module: 'mono', customerId, error: err.message }, 'Failed to import account')
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

    // Step 1: Check account data status first
    const accountDetails = await fetchAccountDetails(accountId)
    const { data_status, retrieved_data } = accountDetails.data.meta
    
    logger.info({ 
      module: 'mono', 
      customerId, 
      accountId, 
      data_status, 
      retrieved_data 
    }, 'Syncing transactions')
    
    // Step 2: If transactions not retrieved yet, trigger a sync
    const hasTransactions = retrieved_data?.some(d => 
      d.toLowerCase().includes('transaction') || d.toLowerCase().includes('statement')
    )
    
    if (!hasTransactions) {
      try {
        await syncAccount(accountId)
        logger.info({ module: 'mono', customerId, accountId }, 'Sync triggered - retry in a few seconds')
      } catch (syncErr: any) {
        logger.warn({ module: 'mono', customerId, accountId, error: syncErr.message }, 'Sync failed')
      }
    }

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

    await bulkInsertTransactions(monoTransactions, customerId, accountId, connectDB)

    logger.info({ 
      module: 'mono', 
      customerId, 
      accountId, 
      transactionsCount: monoTransactions.length 
    }, 'Transactions synced successfully')

    res.json({ 
      success: true, 
      transactionsCount: monoTransactions.length,
      message: 'Transactions synced successfully'
    })
  } catch (err: any) {
    logger.error({ module: 'mono', error: err.message }, 'Failed to sync transactions')
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync transactions', 
      message: err.message 
    })
  }
})
