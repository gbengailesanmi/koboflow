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
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      // Get from session storage by key
      const item = window.sessionStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error loading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to sessionStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to session storage
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
