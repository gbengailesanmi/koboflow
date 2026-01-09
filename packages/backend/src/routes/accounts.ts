import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { connectDB } from '../db/mongo'
import { logger } from '@koboflow/shared'

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
      .collection('accounts')
      .find({ customerId })
      .sort({ lastRefreshed: -1 })
      .toArray()

    res.json({
      status: 'successful',
      message: 'Accounts retrieved successfully',
      timestamp: new Date().toISOString(),
      data: accounts.map((acc: any) => ({
        account: {
          id: acc.id,
          name: acc.name,
          currency: acc.currency,
          type: acc.type,
          account_number: acc.account_number,
          balance: acc.balance,
          bvn: acc.bvn,
          institution: acc.institution,
        },
        customer: {
          id: acc.monoCustomerId,
        },
        meta: acc.meta || {
          data_status: 'AVAILABLE',
          auth_method: acc.meta?.auth_method || 'internet_banking',
        },
      })),
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
      .collection('accounts')
      .findOne({ id, customerId })

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
      data: {
        account: {
          id: account.id,
          name: account.name,
          currency: account.currency,
          type: account.type,
          account_number: account.account_number,
          balance: account.balance,
          bvn: account.bvn,
          institution: account.institution,
        },
        customer: {
          id: account.monoCustomerId,
        },
        meta: account.meta || {
          data_status: 'AVAILABLE',
          auth_method: account.meta?.auth_method || 'internet_banking',
        },
      },
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
