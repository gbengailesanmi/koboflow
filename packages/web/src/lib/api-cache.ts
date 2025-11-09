/**
 * Smart API Cache Manager
 * Automatically caches API responses and invalidates when data changes
 */

type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
}

type CacheInvalidationRule = {
  mutationEndpoints: string[]
  invalidateEndpoints: string[]
}

class ApiCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default
  
  private invalidationRules: CacheInvalidationRule[] = [
    {
      mutationEndpoints: ['/api/accounts', '/api/accounts/sync', '/api/accounts/refresh'],
      invalidateEndpoints: ['/api/accounts', '/api/transactions', '/api/budget']
    },
    {
      mutationEndpoints: ['/api/transactions'],
      invalidateEndpoints: ['/api/transactions', '/api/budget', '/api/analytics']
    },
    {
      mutationEndpoints: ['/api/budget'],
      invalidateEndpoints: ['/api/budget', '/api/analytics']
    },
    {
      mutationEndpoints: ['/api/categories'],
      invalidateEndpoints: ['/api/categories', '/api/transactions', '/api/budget']
    },
    {
      mutationEndpoints: ['/api/settings'],
      invalidateEndpoints: ['/api/settings', '/api/session']
    },
    {
      mutationEndpoints: ['/api/auth/login', '/api/auth/logout', '/api/auth/google/callback', '/api/auth/user'],
      invalidateEndpoints: ['*']
    }
  ]

  private generateKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${endpoint}:${body}`
  }

  get<T>(endpoint: string, options?: RequestInit): T | null {
    const key = this.generateKey(endpoint, options)
    const entry = this.cache.get(key)

    if (!entry) {
      console.log(`❌ Cache miss: ${endpoint}`)
      return null
    }

    if (Date.now() > entry.expiresAt) {
      console.log(`⏰ Cache expired: ${endpoint}`)
      this.cache.delete(key)
      return null
    }

    console.log(`✅ Cache hit: ${endpoint}`)
    return entry.data as T
  }

  set<T>(endpoint: string, data: T, options?: RequestInit, ttl?: number): void {
    const key = this.generateKey(endpoint, options)
    const cacheDuration = ttl || this.defaultTTL
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration
    })

    console.log(`💾 Cached: ${endpoint} (TTL: ${cacheDuration}ms)`)
  }

  invalidateOnMutation(mutationEndpoint: string): void {
    console.log(`🔄 Mutation detected: ${mutationEndpoint}`)

    const matchingRules = this.invalidationRules.filter(rule =>
      rule.mutationEndpoints.some(pattern => 
        mutationEndpoint.includes(pattern)
      )
    )

    if (matchingRules.length === 0) {
      console.log(`⚠️ No invalidation rules for: ${mutationEndpoint}`)
      return
    }

    const endpointsToInvalidate = new Set<string>()
    matchingRules.forEach(rule => {
      rule.invalidateEndpoints.forEach(endpoint => {
        endpointsToInvalidate.add(endpoint)
      })
    })

    if (endpointsToInvalidate.has('*')) {
      console.log(`🗑️ Clearing ALL cache due to: ${mutationEndpoint}`)
      this.clearAll()
      return
    }

    endpointsToInvalidate.forEach(endpoint => {
      this.invalidate(endpoint)
    })
  }

  invalidate(endpointPattern: string): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      const keyEndpoint = key.split(':')[1]
      if (keyEndpoint && keyEndpoint.includes(endpointPattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      console.log(`🗑️ Invalidated: ${key}`)
    })

    if (keysToDelete.length === 0) {
      console.log(`⚠️ No cache entries found for pattern: ${endpointPattern}`)
    }
  }

  clearAll(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🗑️ Cleared ${size} cache entries`)
  }

  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expired++
      } else {
        valid++
      }
    })

    return {
      total: this.cache.size,
      valid,
      expired,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((now - entry.timestamp) / 1000),
        ttl: Math.round((entry.expiresAt - now) / 1000),
        expired: now > entry.expiresAt
      }))
    }
  }

  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.push(rule)
    console.log(`➕ Added invalidation rule:`, rule)
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
    console.log(`⏱️ Default TTL set to: ${ttl}ms`)
  }
}

export const apiCacheManager = new ApiCacheManager()

if (typeof window !== 'undefined') {
  ;(window as any).__apiCache = apiCacheManager
}
