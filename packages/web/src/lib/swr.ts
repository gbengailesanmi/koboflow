'use client'

import type { SWRConfiguration } from 'swr'

/**
 * Simple SWR fetcher with timing logs
 */
export async function fetcher<T = any>(url: string): Promise<T> {
  const startTime = performance.now()
  
  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const totalTime = performance.now() - startTime

  console.log(`%c[SWR] 📡 Data Fetched`, 'color: green; font-weight: bold', {
    url,
    time: `${totalTime.toFixed(2)}ms`,
  })

  return data
}

/**
 * SWR middleware for logging cache hits
 */
export const swrLogger = (useSWRNext: any) => {
  return (key: any, fetcher: any, config: any) => {
    const swr = useSWRNext(key, fetcher, config)

    if (swr.data && !swr.isLoading && !swr.isValidating) {
      console.log(`%c[SWR] ⚡ Cache Hit`, 'color: blue; font-weight: bold', {
        key,
      })
    }

    return swr
  }
}

// configs
export const defaultSWR: SWRConfiguration = {
  fetcher,
  use: [swrLogger],
  revalidateOnReconnect: true,
  keepPreviousData: true,
  revalidateIfStale: true
}

export const cachedSWR: SWRConfiguration = {
  ...defaultSWR,
  revalidateOnMount: undefined,
  revalidateOnFocus: true,
  dedupingInterval: 5000,
  focusThrottleInterval: 60000,
}

export const transactionsSWR: SWRConfiguration = {
  ...defaultSWR,
  revalidateOnMount: undefined,
  revalidateOnFocus: true,
  focusThrottleInterval: 60_000,
  dedupingInterval: 10_000,
  refreshInterval: 300_000,

  refreshWhenHidden: false,
  refreshWhenOffline: false
}

export const accountsSWR: SWRConfiguration = {
  ...cachedSWR,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
}

export const actionDrivenSWR: SWRConfiguration = {
  ...cachedSWR,
  refreshInterval: 0,
}

export const activeSessionsSWR: SWRConfiguration = {
  ...cachedSWR,
  refreshInterval: 15 * 60 * 1000,
}
