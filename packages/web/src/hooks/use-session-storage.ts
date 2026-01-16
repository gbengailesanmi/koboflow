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
  const storageKey = `koboflow:${customerId}:${pageName}:${selectionKey}`
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
      if (key.startsWith('koboflow:')) {
        window.sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
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
    const prefix = `koboflow:${customerId}:`
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        window.sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
  }
}
