import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { connectDB } from '../db/mongo'

export const accountRoutes = Router()

// Get all accounts for a user
accountRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const db = await connectDB()

    const accounts = await db
      .collection('accounts')
      .find({ customerId })
      .toArray()

    res.json({
      success: true,
      accounts,
    })
  } catch (error) {
    console.error('Get accounts error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
    })
  }
})
