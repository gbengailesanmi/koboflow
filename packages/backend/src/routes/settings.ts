import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { getUserSettings, updateUserSettings } from '../services/settings'
import { encryptPIN, decryptPIN } from '../services/pin-security'
import { connectDB } from '../db/mongo'
import { logger } from '@koboflow/shared'

export const settingsRoutes = Router()

settingsRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const settings = await getUserSettings(customerId)

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' })
    }

    const responseData = { 
      success: true,
      settings
    }

    res.json(responseData)
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error fetching settings')
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

settingsRoutes.patch('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updates = req.body

    if ('customerId' in updates) {
      delete updates.customerId
    }

    const result = await updateUserSettings(customerId, updates)

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update settings' })
    }

    const updatedSettings = await getUserSettings(customerId)

    res.json({ 
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error updating settings')
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

settingsRoutes.delete('/account', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    logger.info({ module: 'settings-routes', customerId }, 'Deleting account')

    const db = await connectDB()
    
    const results = await Promise.all([
      db.collection('users').deleteOne({ customerId }),
      db.collection('accounts').deleteMany({ customerId }),
      db.collection('transactions').deleteMany({ customerId }),
      db.collection('budgets').deleteMany({ customerId }),
      db.collection('spending_categories').deleteMany({ customerId }),
      db.collection('settings').deleteOne({ customerId }),
      db.collection('sessions').deleteMany({ customerId }), // ✅ DELETE ALL SESSIONS
    ])



    logger.info({
      module: 'settings-routes',
      customerId,
      users: results[0].deletedCount,
      accounts: results[1].deletedCount,
      transactions: results[2].deletedCount,
      budgets: results[3].deletedCount,
      spending_categories: results[4].deletedCount,
      settings: results[5].deletedCount,
      sessions: results[6].deletedCount
    }, 'Account deletion results')

    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error deleting account')
    res.status(500).json({ 
      error: 'Failed to delete account',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

settingsRoutes.post('/pin/set', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { pin, password } = req.body

    if (!pin || !password) {
      return res.status(400).json({ error: 'PIN and password are required' })
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const bcrypt = await import('bcrypt')
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const encryptedPIN = encryptPIN(pin, password)

    const result = await updateUserSettings(customerId, {
      security: {
        pinHash: encryptedPIN,
        faceId: false,
        givePermission: false,
      }
    })

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to set PIN' })
    }

    res.json({ 
      success: true,
      message: 'PIN set successfully'
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error setting PIN')
    res.status(500).json({ error: 'Failed to set PIN' })
  }
})

settingsRoutes.post('/pin/change', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { oldPin, newPin, password } = req.body

    if (!oldPin || !newPin || !password) {
      return res.status(400).json({ error: 'Old PIN, new PIN, and password are required' })
    }

    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be 4-6 digits' })
    }

    const settings = await getUserSettings(customerId)
    
    if (!settings || !settings.security?.pinHash) {
      return res.status(400).json({ error: 'No PIN is currently set' })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const bcrypt = await import('bcrypt')
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const decryptedOldPin = decryptPIN(settings.security.pinHash, password)
    
    if (!decryptedOldPin || decryptedOldPin !== oldPin) {
      return res.status(401).json({ error: 'Invalid old PIN' })
    }

    const encryptedNewPIN = encryptPIN(newPin, password)

    const result = await updateUserSettings(customerId, {
      security: {
        ...settings.security,
        pinHash: encryptedNewPIN,
      }
    })

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to change PIN' })
    }

    res.json({ 
      success: true,
      message: 'PIN changed successfully'
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error changing PIN')
    res.status(500).json({ error: 'Failed to change PIN' })
  }
})

settingsRoutes.post('/pin/verify', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { pin, password } = req.body

    if (!pin || !password) {
      return res.status(400).json({ error: 'PIN and password are required' })
    }

    const settings = await getUserSettings(customerId)
    
    if (!settings || !settings.security?.pinHash) {
      return res.status(400).json({ error: 'No PIN is set' })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const bcrypt = await import('bcrypt')
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const decryptedPin = decryptPIN(settings.security.pinHash, password)
    
    if (!decryptedPin || decryptedPin !== pin) {
      return res.json({ 
        success: false,
        valid: false,
        message: 'Invalid PIN'
      })
    }

    res.json({ 
      success: true,
      valid: true,
      message: 'PIN is valid'
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error verifying PIN')
    res.status(500).json({ error: 'Failed to verify PIN' })
  }
})

settingsRoutes.post('/password/change', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const bcrypt = await import('bcrypt')
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await db.collection('users').updateOne(
      { customerId },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    )

    // ✅ REVOKE ALL SESSIONS (force re-login after password change)
    const sessionResult = await db.collection('sessions').updateMany(
      { customerId, status: 'active' },
      { 
        $set: { 
          status: 'revoked',
          revokedAt: new Date(),
        } 
      }
    )

    logger.info(
      { module: 'settings-routes', customerId, sessionsRevoked: sessionResult.modifiedCount },
      'Password changed - all sessions revoked'
    )

    const settings = await getUserSettings(customerId)
    if (settings?.security?.pinHash) {
      const decryptedPin = decryptPIN(settings.security.pinHash, currentPassword)
      
      if (decryptedPin) {
        const newEncryptedPIN = encryptPIN(decryptedPin, newPassword)
        
        await updateUserSettings(customerId, {
          security: {
            ...settings.security,
            pinHash: newEncryptedPIN,
          }
        })
      }
    }

    res.json({ 
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    logger.error({ module: 'settings-routes', error }, 'Error changing password')
    res.status(500).json({ error: 'Failed to change password' })
  }
})
