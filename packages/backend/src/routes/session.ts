import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { deleteSession } from '../services/session'
import { connectDB } from '../db/mongo'
import config from '../config'

export const sessionRoutes = Router()

sessionRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }
    
    const { customerId, email, firstName, lastName } = req.user
    const sessionId = req.sessionId
    
    res.json({
      success: true,
      user: {
        customerId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        sessionId: sessionId || ''
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    res.status(500).json({ success: false, message: 'Failed to get session' })
  }
})

sessionRoutes.delete('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sessionId = req.sessionId

    if (sessionId) {
      await deleteSession(sessionId)
    }

    res.clearCookie('session-id', {
      httpOnly: true,
      secure: config.IS_PRODUCTION,
      sameSite: 'lax',
      path: '/'
    })
    
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    res.status(500).json({ success: false, message: 'Logout failed' })
  }
})

sessionRoutes.get('/customer-details', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }
    
    const { customerId } = req.user
    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }
    
    res.json({
      success: true,
      customerDetailsFromMono: user.customerDetailsFromMono || null,
      customerDetailsLastUpdated: user.customerDetailsLastUpdated || null,
    })
  } catch (error) {
    console.error('Get customer details error:', error)
    res.status(500).json({ success: false, message: 'Failed to get customer details' })
  }
})
