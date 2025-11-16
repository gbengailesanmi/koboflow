import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { connectDB } from '../db/mongo'
import { deleteSession } from '../services/session'
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
    
    const db = await connectDB()
    const settings = await db.collection('settings').findOne({ customerId })
    const budget = await db.collection('budgets').findOne({ customerId })
    
    res.json({
      success: true,
      user: {
        customerId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        currency: settings?.currency || 'SEK',
        totalBudgetLimit: budget?.totalBudgetLimit || 0
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
