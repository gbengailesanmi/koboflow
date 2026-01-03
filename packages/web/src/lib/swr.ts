'use client'

/**
 * Simple SWR fetcher
 */
export async function fetcher<T = any>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for auth
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// configs
export const defaultSWR = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
}

export const staticSWR = {
  ...defaultSWR,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
}

export const dynamicSWR = {
  ...defaultSWR,
  refreshInterval: 10000,
  revalidateOnReconnect: true,
}
