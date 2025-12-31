import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { connectDB } from '../db/mongo'

export const transactionRoutes = Router()

transactionRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
        timestamp: new Date().toISOString(),
        data: [],
        meta: {
          total: 0,
          page: 1,
          previous: null,
          next: null,
        },
      })
    }
    
    const db = await connectDB()
    const txnCollection = db.collection('transactions')

    const {
      start,
      end,
      narration,
      type,
      paginate = 'true',
      limit = '50',
      page = '1',
    } = req.query

    const shouldPaginate = paginate === 'true'
    const limitNum = parseInt(limit as string) || 50
    const pageNum = parseInt(page as string) || 1
    const skip = (pageNum - 1) * limitNum

    const query: any = { customerId }

    if (narration) {
      query.narration = { $regex: narration, $options: 'i' }
    }

    if (type === 'debit' || type === 'credit') {
      query.type = type
    }

    if (start || end) {
      query.date = {}
      if (start) {
        const [day, month, year] = (start as string).split('-')
        const startDate = new Date(`${year}-${month}-${day}`)
        query.date.$gte = startDate.toISOString()
      }
      if (end) {
        const [day, month, year] = (end as string).split('-')
        const endDate = new Date(`${year}-${month}-${day}`)
        endDate.setHours(23, 59, 59, 999)
        query.date.$lte = endDate.toISOString()
      }
    }

    const total = await txnCollection.countDocuments(query)

    let transactions
    if (shouldPaginate) {
      transactions = await txnCollection
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray()
    } else {
      transactions = await txnCollection
        .find(query)
        .sort({ date: -1 })
        .toArray()
    }

    const data = transactions.map((txn: any) => ({
      id: txn.id,
      narration: txn.narration,
      amount: txn.amount,
      type: txn.type,
      balance: txn.balance,
      date: txn.date,
      category: txn.category,
      accountId: txn.accountId,
      customerId: txn.customerId,
      accountNumber: txn.accountNumber,
      bankCode: txn.bankCode,
      hash: txn.hash,
    }))

    const totalPages = shouldPaginate ? Math.ceil(total / limitNum) : 1
    const hasNext = shouldPaginate && pageNum < totalPages
    const hasPrevious = shouldPaginate && pageNum > 1

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`
    const queryParams = new URLSearchParams(req.query as any)

    let nextUrl = null
    if (hasNext) {
      queryParams.set('page', String(pageNum + 1))
      nextUrl = `${baseUrl}?${queryParams.toString()}`
    }

    let previousUrl = null
    if (hasPrevious) {
      queryParams.set('page', String(pageNum - 1))
      previousUrl = `${baseUrl}?${queryParams.toString()}`
    }

    res.json({
      status: 'successful',
      message: 'Transaction retrieved successfully',
      timestamp: new Date().toISOString(),
      data,
      meta: {
        total,
        page: pageNum,
        previous: previousUrl,
        next: nextUrl,
      },
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      timestamp: new Date().toISOString(),
      data: [],
      meta: {
        total: 0,
        page: 1,
        previous: null,
        next: null,
      },
    })
  }
})
