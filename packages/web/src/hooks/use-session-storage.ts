'use client'
/**
 * Custom hook for persisting state in sessionStorage
 * 
 * This hook works like useState but automatically saves/restores from sessionStorage.
 * Data persists during the browser tab session but is cleared when tab closes.
 * 
 * Usage:
 * ```tsx
 * const [value, setValue] = useSessionStorage('my-key', 'default-value')
 * ```
 */

import { useState, useCallback } from 'react'

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error loading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        setStoredValue(valueToStore)
        
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error saving to sessionStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

/**
 * Hook specifically for page-level selections
 * Automatically namespaces by page and customerId
 */
export function usePageSelection<T>(
  pageName: string,
  customerId: string,
  selectionKey: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const storageKey = `money-mapper:${customerId}:${pageName}:${selectionKey}`
  return useSessionStorage(storageKey, initialValue)
}

/**
 * Clear all sessionStorage keys for the app
 * Useful for logout, session timeout, etc.
 */
export function clearAllAppSessionStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(window.sessionStorage)
    keys.forEach(key => {
      if (key.startsWith('money-mapper:')) {
        window.sessionStorage.removeItem(key)
      }
    })
    console.log('Cleared all app sessionStorage')
  } catch (error) {
    console.warn('Error clearing app sessionStorage:', error)
  }
}

/**
 * Clear sessionStorage keys for a specific customer
 * Useful when switching between customers
 */
export function clearCustomerSessionStorage(customerId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(window.sessionStorage)
    const prefix = `money-mapper:${customerId}:`
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        window.sessionStorage.removeItem(key)
      }
    })
    console.log(`Cleared sessionStorage for customer: ${customerId}`)
  } catch (error) {
    console.warn(`Error clearing sessionStorage for customer ${customerId}:`, error)
  }
}
