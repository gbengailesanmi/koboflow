import { DEFAULT_SETTINGS, SettingsUpdate } from './default-settings'

export type { SettingsUpdate }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Gets user settings by calling backend API
 * Falls back to default settings if not found
 */
export async function getUserSettings(customerId: string) {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-customer-id': customerId,
      },
      cache: 'no-store', // Don't cache for SSR
    })

    if (!response.ok) {
      console.error('Failed to fetch settings:', response.statusText)
      return {
        customerId,
        ...DEFAULT_SETTINGS,
      }
    }

    const data = await response.json()
    return data.settings || {
      customerId,
      ...DEFAULT_SETTINGS,
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return {
      customerId,
      ...DEFAULT_SETTINGS,
    }
  }
}
