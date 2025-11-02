import { connectDB } from '@/db/mongo'
import { DEFAULT_SETTINGS, SettingsUpdate } from './default-settings'

/**
 * Creates default settings for a new user
 */
export async function createUserSettings(customerId: string) {
  const db = await connectDB()
  const settings = {
    customerId,
    ...DEFAULT_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.collection('settings').insertOne(settings)
  return settings
}

/**
 * Gets user settings, creates default if not exists
 */
export async function getUserSettings(customerId: string) {
  const db = await connectDB()
  
  let settings = await db.collection('settings').findOne({ customerId })
  
  // If settings don't exist, create them
  if (!settings) {
    settings = await createUserSettings(customerId)
  }
  
  return settings
}

/**
 * Updates user settings (partial update)
 */
export async function updateUserSettings(
  customerId: string,
  updates: SettingsUpdate
) {
  const db = await connectDB()
  
  const result = await db.collection('settings').findOneAndUpdate(
    { customerId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      upsert: true, // Create if doesn't exist
    }
  )
  
  return result
}

/**
 * Updates a specific setting path (for nested updates)
 */
export async function updateSettingPath(
  customerId: string,
  path: string,
  value: any
) {
  const db = await connectDB()
  
  const result = await db.collection('settings').findOneAndUpdate(
    { customerId },
    {
      $set: {
        [path]: value,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
    }
  )
  
  return result
}

/**
 * Resets user settings to defaults
 */
export async function resetUserSettings(customerId: string) {
  const db = await connectDB()
  
  const result = await db.collection('settings').findOneAndUpdate(
    { customerId },
    {
      $set: {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
    }
  )
  
  return result
}

/**
 * Deletes user settings (used when deleting account)
 */
export async function deleteUserSettings(customerId: string) {
  const db = await connectDB()
  
  await db.collection('settings').deleteOne({ customerId })
}
