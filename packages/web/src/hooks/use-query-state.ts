// ============================================================================
// DEPRECATED: Legacy Custom Query State Hooks
// ============================================================================
// This entire file is deprecated in favor of using the `nuqs` library.
// All new code should use `useQueryState` or `useQueryStates` from 'nuqs'.
// 
// Migration guide:
//   Before: const [value, setValue] = useQueryState('key', 'default')
//   After:  const [value, setValue] = useQueryState('key', parseAsString.withDefault('default'))
//
//   Before: const [value, setValue] = useQueryStateNullable('key')
//   After:  const [value, setValue] = useQueryState('key', parseAsString.withDefault(''))
//           // Then use `value || null` if you need null
//
//   Before: const [values, setValues] = useQueryStateArray('key')
//   After:  const [values, setValues] = useQueryState('key', parseAsArrayOf(parseAsString).withDefault([]))
//
// Benefits of `nuqs`:
//   ✅ Atomic updates (no race conditions)
//   ✅ Type-safe parsers
//   ✅ Better developer experience
//   ✅ Automatic URL synchronization
//   ✅ Built-in shallow routing support
//
// These hooks will be removed in a future version.
// ============================================================================

'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * @deprecated Use `useQueryState` from 'nuqs' instead
 * @example
 * import { useQueryState, parseAsString } from 'nuqs'
 * const [value, setValue] = useQueryState('key', parseAsString.withDefault('default'))
 */
export function useQueryState(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const router = useRouter()
  const params = useSearchParams()

  const value = params.get(key) ?? defaultValue

  function setValue(next: string) {
    const p = new URLSearchParams(params.toString())
    
    if (next === defaultValue) {
      // Remove param if it's the default value (keeps URL clean)
      p.delete(key)
    } else {
      p.set(key, next)
    }
    
    const queryString = p.toString()
    const url = queryString ? `?${queryString}` : window.location.pathname
    
    router.push(url, { scroll: false })
  }

  return [value, setValue]
}

/**
 * @deprecated Use `useQueryState` from 'nuqs' instead
 * @example
 * import { useQueryState, parseAsString } from 'nuqs'
 * const [value, setValue] = useQueryState('key', parseAsString.withDefault(''))
 * // Use `value || null` if you need null semantics
 */
export function useQueryStateNullable(
  key: string
): [string | null, (value: string | null) => void] {
  const router = useRouter()
  const params = useSearchParams()

  const value = params.get(key)

  function setValue(next: string | null) {
    const p = new URLSearchParams(params.toString())
    
    if (next === null || next === '') {
      p.delete(key)
    } else {
      p.set(key, next)
    }
    
    const queryString = p.toString()
    const url = queryString ? `?${queryString}` : window.location.pathname
    
    router.push(url, { scroll: false })
  }

  return [value, setValue]
}

/**
 * @deprecated Use `useQueryState` from 'nuqs' with array parser instead
 * @example
 * import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
 * const [values, setValues] = useQueryState('key', parseAsArrayOf(parseAsString).withDefault([]))
 */
export function useQueryStateArray(
  key: string
): [string[], (values: string[]) => void] {
  const router = useRouter()
  const params = useSearchParams()

  const paramValue = params.get(key)
  const value = paramValue ? paramValue.split(',').filter(Boolean) : []

  function setValue(next: string[]) {
    const p = new URLSearchParams(params.toString())
    
    if (next.length === 0) {
      p.delete(key)
    } else {
      p.set(key, next.join(','))
    }
    
    const queryString = p.toString()
    const url = queryString ? `?${queryString}` : window.location.pathname
    
    router.push(url, { scroll: false })
  }

  return [value, setValue]
}
