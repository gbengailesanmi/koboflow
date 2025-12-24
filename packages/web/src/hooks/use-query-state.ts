'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
