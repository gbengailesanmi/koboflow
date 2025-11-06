import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { connectDB } from '../db/mongo'

export const accountRoutes = Router()

accountRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }
    
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
