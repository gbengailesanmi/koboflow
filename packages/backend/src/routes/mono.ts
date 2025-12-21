import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import {
  exchangeToken,
  fetchAccountDetails,
  fetchAccountIdentity,
  fetchTransactions,
  formatAccountForStorage,
  fetchAllTransactions,
} from '../services/mono'
import { bulkInsertMonoAccounts } from '../db/helpers/insert-mono-accounts'
import { bulkInsertMonoTransactions } from '../db/helpers/insert-mono-transactions'
import { updateCustomerDetailsFromMono } from '../db/helpers/update-customer-details-from-mono'
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

    console.log(`[Mono] Fetching identity for account ${accountId}`)
    const identity = await fetchAccountIdentity(accountId)
    
    res.json({
      success: true,
      data: identity,
    })
  } catch (err: any) {
    console.error('[Mono] Get identity error:', err)
    res.status(500).json({ success: false, error: 'Failed to get account identity', message: err.message })
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

    // Step 1: Fetch identity data first (contains customer info including BVN)
    let identity
    let customerBVN: string | null = null
    
    try {
      console.log(`[Mono] Fetching identity for account ${accountId}`)
      identity = await fetchAccountIdentity(accountId)
      customerBVN = identity.bvn
      console.log(`[Mono] Got identity: BVN=${customerBVN}, Name=${identity.full_name}`)
      
      // Step 2: Update customer details in users collection
      await updateCustomerDetailsFromMono(customerId, identity, connectDB)
      console.log(`[Mono] ✅ Customer details updated in users collection`)
    } catch (err: any) {
      console.warn(`[Mono] ⚠️  Failed to fetch/update identity: ${err.message}`)
      // Continue without identity data - some accounts may not have it
      // But try to get existing BVN from user document
      try {
        const db = await connectDB()
        const user = await db.collection('users').findOne({ customerId })
        if (user?.customerDetailsFromMono?.bvn) {
          customerBVN = user.customerDetailsFromMono.bvn
          console.log(`[Mono] Using existing BVN from user: ${customerBVN}`)
        }
      } catch (e) {
        console.warn(`[Mono] Could not fetch existing user BVN`)
      }
    }

    // Step 3: Fetch account details
    const response = await fetchAccountDetails(accountId)
    const accountBVN = response.data.account.bvn

    // Step 4: Validate BVN match if both are available
    if (customerBVN && accountBVN && customerBVN !== accountBVN) {
      console.error(`[Mono] ❌ BVN mismatch!`)
      console.error(`[Mono]    - Customer BVN: ${customerBVN}`)
      console.error(`[Mono]    - Account BVN: ${accountBVN}`)
      return res.status(400).json({ 
        success: false, 
        error: 'Account BVN does not match customer BVN. Cannot link account.' 
      })
    }

    if (customerBVN && accountBVN) {
      console.log(`[Mono] ✅ BVN validation passed: ${customerBVN}`)
    } else if (!accountBVN) {
      console.warn(`[Mono] ⚠️  Account has no BVN, skipping validation`)
    } else if (!customerBVN) {
      console.warn(`[Mono] ⚠️  Customer has no BVN on record, skipping validation`)
    }
    
    // Step 5: Store account
    const accountForStorage = formatAccountForStorage(response.data, customerId)
    await bulkInsertMonoAccounts([accountForStorage], customerId, connectDB)

    console.log(`[Mono] ✅ Successfully imported account ${accountId}`)
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
