import { DEFAULT_SETTINGS, SettingsUpdate } from './default-settings'
import config from '../config'

export type { SettingsUpdate }

const BACKEND_URL = config.BACKEND_URL

export async function getUserSettings(customerId: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings`, {
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
