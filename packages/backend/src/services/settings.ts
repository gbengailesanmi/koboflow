import { connectDB } from '../db/mongo.js'

const defaultSettings = {
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  theme: 'light',
  notifications: {
    email: true,
    budgetAlerts: true,
  },
}

export async function createUserSettings(customerId: string) {
  try {
    const db = await connectDB()
    
    const result = await db.collection('settings').insertOne({
      customerId,
      ...defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true, settingsId: result.insertedId }
  } catch (error) {
    console.error('Error creating user settings:', error)
    return { success: false, error }
  }
}

export async function getUserSettings(customerId: string) {
  try {
    const db = await connectDB()
    const settings = await db.collection('settings').findOne({ customerId })
    
    if (!settings) {
      // Create default settings if they don't exist
      await createUserSettings(customerId)
      return { ...defaultSettings, customerId }
    }
    
    return settings
  } catch (error) {
    console.error('Error getting user settings:', error)
    throw error
  }
}

export async function updateUserSettings(customerId: string, updates: any) {
  try {
    const db = await connectDB()
    
    const result = await db.collection('settings').updateOne(
      { customerId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      }
    )

    return { success: true, modifiedCount: result.modifiedCount }
  } catch (error) {
    console.error('Error updating user settings:', error)
    return { success: false, error }
  }
}
