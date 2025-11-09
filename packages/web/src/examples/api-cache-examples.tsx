/**
 * API Caching System - Usage Examples
 * 
 * This file demonstrates how to use the automatic API caching system
 * across different scenarios in the Money Mapper app.
 * 
 * NOTE: These are examples for reference only. They may not be directly
 * usable without proper types from your project.
 */

import { apiClient } from '@/lib/api-client'
import { apiCacheManager } from '@/lib/api-cache'
import { useState, useEffect } from 'react'

// ============================================================================
// Example 1: Simple Component with Automatic Caching
// ============================================================================

export function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // First call: Fetches from API and caches result
    // Subsequent calls (within 5 min): Returns from cache instantly
    apiClient.getAccounts()
      .then((data: any) => {
        setAccounts(data.accounts || [])
        setLoading(false)
      })
      .catch((err: any) => {
        console.error('Failed to load accounts:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading accounts...</div>

  return (
    <div>
      {accounts.map((account: any) => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  )
}

// ============================================================================
// Example 2: Component with Data Mutation and Cache Invalidation
// ============================================================================

export function AccountsWithRefresh() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadAccounts = async () => {
    const data: any = await apiClient.getAccounts()
    setAccounts(data.accounts || [])
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // This POST request automatically invalidates accounts cache
      await apiClient.refreshAccounts()
      
      // Next call gets fresh data because cache was invalidated
      await loadAccounts()
    } catch (err: any) {
      console.error('Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Accounts'}
      </button>
      {accounts.map((account: any) => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  )
}

// ============================================================================
// Example 3: Multiple Components Sharing Cached Data
// ============================================================================

// Component A - Loads accounts
export function AccountsHeader() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    // Fetches and caches accounts
    apiClient.getAccounts().then((data: any) => {
      setAccounts(data.accounts || [])
    })
  }, [])

  return <div>Total Accounts: {accounts.length}</div>
}

// Component B - Also needs accounts
export function AccountsDropdown() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    // Returns cached data from Component A (instant!)
    apiClient.getAccounts().then((data: any) => {
      setAccounts(data.accounts || [])
    })
  }, [])

  return (
    <select>
      {accounts.map((account: any) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// Example 4: Budget Management with Automatic Cache Invalidation
// ============================================================================

export function BudgetManager() {
  const [budget, setBudget] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  const loadData = async () => {
    // Both calls are cached
    const [budgetData, categoriesData]: any[] = await Promise.all([
      apiClient.getBudget(),
      apiClient.getCategories()
    ])
    setBudget(budgetData)
    setCategories(categoriesData.categories || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateBudget = async (updates: any) => {
    try {
      // This PATCH automatically invalidates budget cache
      await apiClient.updateBudget(updates)
      
      // Reload fresh data
      await loadData()
      
      alert('Budget updated!')
    } catch (err: any) {
      console.error('Update failed:', err)
    }
  }

  const handleUpdateCategory = async (id: string, updates: any) => {
    try {
      // This PATCH invalidates: categories, transactions, budget
      await apiClient.updateCategory(id, updates)
      
      // Both budget and categories are refetched fresh
      await loadData()
      
      alert('Category updated!')
    } catch (err: any) {
      console.error('Update failed:', err)
    }
  }

  return (
    <div>
      <h2>Budget: {budget?.totalBudgetLimit}</h2>
      {categories.map((cat: any) => (
        <div key={cat.id}>
          {cat.name}
          <button onClick={() => handleUpdateCategory(cat.id, { name: 'New Name' })}>
            Edit
          </button>
        </div>
      ))}
      <button onClick={() => handleUpdateBudget({ totalBudgetLimit: 5000 })}>
        Update Budget
      </button>
    </div>
  )
}

// ============================================================================
// Example 5: Transactions with Real-time Updates
// ============================================================================

export function TransactionsList() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])

  const loadData = async () => {
    // Parallel fetching with caching
    const [txnData, accData]: any[] = await Promise.all([
      apiClient.getTransactions(),
      apiClient.getAccounts()
    ])
    setTransactions(txnData.transactions || [])
    setAccounts(accData.accounts || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefreshAccounts = async () => {
    // Refreshing accounts also invalidates transactions
    await apiClient.refreshAccounts()
    
    // Both caches invalidated, fetch fresh data
    await loadData()
  }

  return (
    <div>
      <button onClick={handleRefreshAccounts}>
        Sync with Bank
      </button>
      {transactions.map((txn: any) => (
        <div key={txn.id}>
          {txn.narration} - {txn.amount}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Example 6: Settings Page with Cache Management
// ============================================================================

export function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [session, setSession] = useState<any>(null)

  const loadData = async () => {
    const [settingsData, sessionData]: any[] = await Promise.all([
      apiClient.getSettings(),
      apiClient.getSession()
    ])
    setSettings(settingsData)
    setSession(sessionData)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      // This invalidates: settings, session caches
      await apiClient.updateSettings(newSettings)
      
      // Reload fresh data
      await loadData()
      
      alert('Settings updated!')
    } catch (err: any) {
      console.error('Update failed:', err)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently?')) return
    
    try {
      // This invalidates ALL cache (auth mutation)
      await apiClient.deleteAccount(session?.user?.customerId)
      
      // Redirect handled by API client
    } catch (err: any) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div>
      <h2>Settings for {session?.user?.email}</h2>
      <button onClick={() => handleUpdateSettings({ theme: 'dark' })}>
        Update Settings
      </button>
      <button onClick={handleDeleteAccount} style={{ color: 'red' }}>
        Delete Account
      </button>
    </div>
  )
}

// ============================================================================
// Example 7: Custom Cache Management
// ============================================================================

export function AdvancedCacheExample() {
  const [cacheStats, setCacheStats] = useState<any>(null)

  const showCacheStats = () => {
    const stats = apiCacheManager.getStats()
    setCacheStats(stats)
    console.table(stats.entries)
  }

  const clearSpecificCache = () => {
    // Clear only accounts cache
    apiCacheManager.invalidate('/api/accounts')
    alert('Accounts cache cleared!')
  }

  const clearAllCache = () => {
    apiCacheManager.clearAll()
    alert('All cache cleared!')
  }

  const addCustomRule = () => {
    // Add custom invalidation rule
    apiCacheManager.addInvalidationRule({
      mutationEndpoints: ['/api/custom-endpoint'],
      invalidateEndpoints: ['/api/related-endpoint']
    })
    alert('Custom rule added!')
  }

  const changeDefaultTTL = () => {
    // Change cache duration to 10 minutes
    apiCacheManager.setDefaultTTL(10 * 60 * 1000)
    alert('Cache TTL set to 10 minutes')
  }

  return (
    <div>
      <h2>Cache Management Tools</h2>
      
      <button onClick={showCacheStats}>
        Show Cache Stats
      </button>
      
      <button onClick={clearSpecificCache}>
        Clear Accounts Cache
      </button>
      
      <button onClick={clearAllCache}>
        Clear All Cache
      </button>
      
      <button onClick={addCustomRule}>
        Add Custom Rule
      </button>
      
      <button onClick={changeDefaultTTL}>
        Set TTL to 10min
      </button>

      {cacheStats && (
        <pre>{JSON.stringify(cacheStats, null, 2)}</pre>
      )}
    </div>
  )
}

// ============================================================================
// Example 8: Navigation Between Pages (Using Dashboard Hook)
// ============================================================================

import { useDashboardData } from '@/hooks/use-dashboard-data'

export function DashboardPage({ customerId }: { customerId: string }) {
  // All three API calls benefit from caching
  const { data, loading, error, refetch } = useDashboardData(customerId)
  const { profile, accounts, transactions } = data

  const handleForceRefresh = async () => {
    // Bypass cache and fetch fresh
    await refetch()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Welcome, {profile?.name}</h1>
      <p>Accounts: {accounts.length}</p>
      <p>Transactions: {transactions.length}</p>
      
      <button onClick={handleForceRefresh}>
        Force Refresh
      </button>
    </div>
  )
}

// ============================================================================
// Example 9: Optimistic Updates (Advanced Pattern)
// ============================================================================

export function OptimisticUpdates() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    apiClient.getCategories().then((data: any) => {
      setCategories(data.categories || [])
    })
  }, [])

  const handleDeleteCategory = async (id: string) => {
    // Optimistically update UI
    setCategories(prev => prev.filter((cat: any) => cat.id !== id))
    
    try {
      // Delete on server (invalidates cache)
      await apiClient.deleteCategory(id)
      
      // Success! UI already updated
    } catch (err: any) {
      // Revert on error
      const data: any = await apiClient.getCategories()
      setCategories(data.categories || [])
      alert('Delete failed')
    }
  }

  return (
    <div>
      {categories.map((cat: any) => (
        <div key={cat.id}>
          {cat.name}
          <button onClick={() => handleDeleteCategory(cat.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Example 10: Polling with Cache
// ============================================================================

export function PollingExample() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    const loadAccounts = async () => {
      // Uses cache if available, otherwise fetches
      const data: any = await apiClient.getAccounts()
      setAccounts(data.accounts || [])
    }

    // Initial load
    loadAccounts()

    // Poll every 30 seconds
    // Will use cache most of the time, only fetches when expired
    const interval = setInterval(loadAccounts, 30 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <p>Auto-refreshing accounts (every 30s, with caching)</p>
      {accounts.map((account: any) => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  )
}
