'use client'

import { mutate } from 'swr'
import { ACTION_CACHE_MAP } from './action-cache-map'

type ActionResult = {
  success?: boolean
  __actionName?: string
  [key: string]: any
}

export async function runAction<T extends (...args: any[]) => Promise<ActionResult>>(
  action: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> {
  const result = await action(...args)

  if (result?.success && result.__actionName) {
    const cacheKeys = ACTION_CACHE_MAP[result.__actionName]
    
    if (cacheKeys && cacheKeys.length > 0) {
      console.log(`🔄 Mutating cache for action: ${result.__actionName}`, cacheKeys)
      await Promise.all(cacheKeys.map(key => mutate(key)))
      console.log('✅ Cache mutation complete')
    }
  }

  return result as Awaited<ReturnType<T>>
}
