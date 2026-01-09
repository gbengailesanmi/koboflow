import { connectDB } from '../db/mongo'
import { UserSettings, DEFAULT_SETTINGS, logger } from '@koboflow/shared'

export async function createUserSettings(customerId: string): Promise<{ success: boolean; settingsId?: any; error?: any }> {
  try {
    const db = await connectDB()
    
    logger.info({ module: 'settings-service', customerId }, 'Creating settings for user')
    
    const settings: UserSettings = {
      customerId,
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('settings').insertOne(settings)
    
    logger.info({
      module: 'settings-service',
      settingsId: result.insertedId,
      theme: DEFAULT_SETTINGS.appearance.theme,
      emailNotifications: DEFAULT_SETTINGS.receiveOn.email,
      budgetAlerts: DEFAULT_SETTINGS.notifications.budgetAlerts
    }, 'Settings created')

    return { success: true, settingsId: result.insertedId }
  } catch (error) {
    logger.error({ module: 'settings-service', error }, 'Error creating user settings')
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
    logger.error({ module: 'settings-service', error }, 'Error getting user settings')
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
    logger.error({ module: 'settings-service', error }, 'Error updating user settings')
    return { success: false, error }
  }
}
