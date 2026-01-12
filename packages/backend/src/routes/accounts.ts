import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { connectDB } from '../db/mongo'
import { logger, Account } from '@koboflow/shared'

export const accountRoutes = Router()

accountRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({
        status: 'failed',
        message: 'Unauthorized',
        timestamp: new Date().toISOString(),
      })
    }
    
    const db = await connectDB()

    const accounts = await db
      .collection<Account>('accounts')
      .find({ customerId }, { 
        projection: { 
          _id: 0,
          bvn: 0,
          monoCustomerId: 0,
          meta: 0
        } 
      })
      .sort({ lastRefreshed: -1 })
      .toArray()

    res.json({
      status: 'successful',
      message: 'Accounts retrieved successfully',
      timestamp: new Date().toISOString(),
      data: accounts,
      meta: {
        total: accounts.length,
      },
    })
  } catch (error) {
    logger.error({ module: 'accounts-routes', error }, 'Failed to get accounts')
    res.status(500).json({
      status: 'failed',
      message: 'Failed to fetch accounts',
      timestamp: new Date().toISOString(),
    })
  }
})

accountRoutes.get('/:id', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    const { id } = req.params
    
    if (!customerId) {
      return res.status(401).json({
        status: 'failed',
        message: 'Unauthorized',
        timestamp: new Date().toISOString(),
      })
    }
    
    const db = await connectDB()

    const account = await db
      .collection<Account>('accounts')
      .findOne({ id, customerId }, { 
        projection: { 
          _id: 0,
          bvn: 0,
          monoCustomerId: 0,
          meta: 0
        } 
      })

    if (!account) {
      return res.status(404).json({
        status: 'failed',
        message: 'Account not found',
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      status: 'successful',
      message: 'Request was successfully completed',
      timestamp: new Date().toISOString(),
      data: account,
    })
  } catch (error) {
    logger.error({ module: 'accounts-routes', accountId: req.params.id, error }, 'Failed to get account')
    res.status(500).json({
      status: 'failed',
      message: 'Failed to fetch account',
      timestamp: new Date().toISOString(),
    })
  }
})
