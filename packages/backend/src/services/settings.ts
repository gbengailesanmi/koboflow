import { connectDB } from '../db/mongo'
import { UserSettings, DEFAULT_SETTINGS } from '@money-mapper/shared'

export async function createUserSettings(customerId: string): Promise<{ success: boolean; settingsId?: any; error?: any }> {
  try {
    const db = await connectDB()
    
    console.log(`[Settings] Creating settings for user: ${customerId}`)
    
    const settings: UserSettings = {
      customerId,
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('settings').insertOne(settings)
    
    console.log(`[Settings] ✅ Settings created with ID: ${result.insertedId}`)
    console.log(`[Settings]    - Theme: ${DEFAULT_SETTINGS.appearance.theme}`)
    console.log(`[Settings]    - Email notifications: ${DEFAULT_SETTINGS.receiveOn.email}`)
    console.log(`[Settings]    - Budget alerts: ${DEFAULT_SETTINGS.notifications.budgetAlerts}`)

    return { success: true, settingsId: result.insertedId }
  } catch (error) {
    console.error('[Settings] ❌ Error creating user settings:', error)
    return { success: false, error }
  }
}

export async function getUserSettings(customerId: string): Promise<UserSettings | null> {
  try {
    const db = await connectDB()
    const settings = await db.collection('settings').findOne({ customerId })
    
    if (!settings) {
      const createResult = await createUserSettings(customerId)
      if (createResult.success) {
        return {
          customerId,
          ...DEFAULT_SETTINGS,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      return null
    }
    
    return settings as unknown as UserSettings
  } catch (error) {
    console.error('Error getting user settings:', error)
    throw error
  }
}

export async function updateUserSettings(
  customerId: string,
  updates: Partial<UserSettings>
): Promise<{ success: boolean; modifiedCount?: number; error?: any }> {
  try {
    const db = await connectDB()
    
    const { customerId: _, createdAt: __, ...safeUpdates } = updates as any
    const flattenedUpdates: Record<string, any> = {}
    
    const flatten = (obj: any, prefix = '') => {
      for (const key in obj) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key
        
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          flatten(value, newKey)
        } else {
          flattenedUpdates[newKey] = value
        }
      }
    }
    
    flatten(safeUpdates)
    
    const result = await db.collection('settings').updateOne(
      { customerId },
      { 
        $set: { 
          ...flattenedUpdates, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    )

    return { success: true, modifiedCount: result.modifiedCount }
  } catch (error) {
    console.error('Error updating user settings:', error)
    return { success: false, error }
  }
}
