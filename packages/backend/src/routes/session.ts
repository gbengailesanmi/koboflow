import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'

export const sessionRoutes = Router()

// Get current session
sessionRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    // @ts-ignore - customerId is set by authMiddleware
    const { customerId, email, firstName, lastName } = req.user
    
    res.json({
      user: {
        customerId,
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim()
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    res.status(500).json({ user: null })
  }
})

// Logout (invalidate token on client side)
sessionRoutes.delete('/', async (req, res) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // Server-side token invalidation would require a blacklist
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    res.status(500).json({ success: false, message: 'Logout failed' })
  }
})
