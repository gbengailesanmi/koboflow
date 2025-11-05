import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { connectDB } from '../db/mongo'

export const settingsRoutes = Router()

// Import settings helpers (you'll need to copy these from web package)
async function getUserSettings(customerId: string) {
  const db = await connectDB()
  const settings = await db.collection('settings').findOne({ customerId })
  return settings || {}
}

async function updateUserSettings(customerId: string, updates: any) {
  const db = await connectDB()
  const result = await db.collection('settings').findOneAndUpdate(
    { customerId },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      }
    },
    { 
      upsert: true,
      returnDocument: 'after'
    }
  )
  return result
}

/**
 * GET /api/settings
 * Get user settings
 */
settingsRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const settings = await getUserSettings(customerId)

    res.json({ 
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

/**
 * POST /api/settings
 * Update user settings
 */
settingsRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { customerId: bodyCustomerId, ...updates } = req.body

    if (bodyCustomerId && bodyCustomerId !== customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updatedSettings = await updateUserSettings(customerId, updates)

    res.json({ 
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

/**
 * DELETE /api/settings/account
 * Delete user account and all associated data
 */
settingsRoutes.delete('/account', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { customerId: bodyCustomerId } = req.body

    // Verify the customerId matches the session
    if (bodyCustomerId && bodyCustomerId !== customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const db = await connectDB()
    
    // Delete all user data
    await Promise.all([
      db.collection('users').deleteOne({ customerId }),
      db.collection('accounts').deleteMany({ customerId }),
      db.collection('transactions').deleteMany({ customerId }),
      db.collection('budgets').deleteOne({ customerId }),
      db.collection('spending_categories').deleteMany({ customerId }),
      db.collection('settings').deleteOne({ customerId })
    ])

    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})
