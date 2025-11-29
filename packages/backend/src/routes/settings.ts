import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { getUserSettings, updateUserSettings } from '../services/settings'
import { encryptPIN, decryptPIN } from '../services/pin-security'
import { connectDB } from '../db/mongo'

export const settingsRoutes = Router()

settingsRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const settings = await getUserSettings(customerId)

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' })
    }

    res.json({ 
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

settingsRoutes.patch('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updates = req.body

    // Prevent updating customerId
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
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

settingsRoutes.delete('/account', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { customerId: bodyCustomerId } = req.body

    if (bodyCustomerId && bodyCustomerId !== customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const db = await connectDB()
    
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

// Set PIN
settingsRoutes.post('/pin/set', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { pin, password } = req.body

    if (!pin || !password) {
      return res.status(400).json({ error: 'PIN and password are required' })
    }

    // Validate PIN format (must be 4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' })
    }

    // Verify user's password
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

    // Encrypt PIN
    const encryptedPIN = encryptPIN(pin, password)

    // Update settings
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
    console.error('Error setting PIN:', error)
    res.status(500).json({ error: 'Failed to set PIN' })
  }
})

// Change PIN
settingsRoutes.post('/pin/change', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { oldPin, newPin, password } = req.body

    if (!oldPin || !newPin || !password) {
      return res.status(400).json({ error: 'Old PIN, new PIN, and password are required' })
    }

    // Validate new PIN format
    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be 4-6 digits' })
    }

    // Get current settings
    const settings = await getUserSettings(customerId)
    
    if (!settings || !settings.security?.pinHash) {
      return res.status(400).json({ error: 'No PIN is currently set' })
    }

    // Verify password
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

    // Verify old PIN
    const decryptedOldPin = decryptPIN(settings.security.pinHash, password)
    
    if (!decryptedOldPin || decryptedOldPin !== oldPin) {
      return res.status(401).json({ error: 'Invalid old PIN' })
    }

    // Encrypt new PIN
    const encryptedNewPIN = encryptPIN(newPin, password)

    // Update settings
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
    console.error('Error changing PIN:', error)
    res.status(500).json({ error: 'Failed to change PIN' })
  }
})

// Verify PIN
settingsRoutes.post('/pin/verify', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { pin, password } = req.body

    if (!pin || !password) {
      return res.status(400).json({ error: 'PIN and password are required' })
    }

    // Get current settings
    const settings = await getUserSettings(customerId)
    
    if (!settings || !settings.security?.pinHash) {
      return res.status(400).json({ error: 'No PIN is set' })
    }

    // Verify password
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

    // Decrypt and verify PIN
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
    console.error('Error verifying PIN:', error)
    res.status(500).json({ error: 'Failed to verify PIN' })
  }
})

// Change Password
settingsRoutes.post('/password/change', authMiddleware, async (req: AuthRequest, res) => {
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

    // Get user
    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const bcrypt = await import('bcrypt')
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db.collection('users').updateOne(
      { customerId },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    )

    // If user has PIN set, we need to re-encrypt it with new password
    const settings = await getUserSettings(customerId)
    if (settings?.security?.pinHash) {
      // Decrypt PIN with old password
      const decryptedPin = decryptPIN(settings.security.pinHash, currentPassword)
      
      if (decryptedPin) {
        // Re-encrypt with new password
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
    console.error('Error changing password:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})
