import { cookies } from 'next/headers'
import config from '../config'

export interface SessionData {
  customerId: string
  email: string
  name?: string
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const BACKEND_URL = config.BACKEND_URL
    const response = await fetch(`${BACKEND_URL}/api/session`, {
      headers: {
        Cookie: `auth-token=${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export function getSessionFromCookies(): SessionData | null {
  if (typeof window === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(c => c.trim().startsWith('session='))
  
  if (!sessionCookie) {
    return null
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]))
    return sessionData
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}
