import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { connectDB } from '../db/mongo'

export const transactionRoutes = Router()

// Get all transactions for a user
transactionRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }
    
    const db = await connectDB()

    const transactions = await db
      .collection('transactions')
      .find({ customerId })
      .sort({ bookedDate: -1 })
      .toArray()

    res.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    })
  }
})
