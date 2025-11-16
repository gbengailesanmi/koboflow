# Architecture Migration: API-Service Only + Zustand for UI State

## ✅ Next.js 15 Caching Confirmation

**Yes, Next.js DOES cache API calls automatically!**

Next.js 15 provides built-in data caching with the following features:

### 1. **Fetch Request Caching**
```typescript
// Cached for 60 seconds
fetch('url', { next: { revalidate: 60 } })

// Cached with tags for granular invalidation
fetch('url', { next: { tags: ['accounts'] } })

// No cache
fetch('url', { cache: 'no-store' })
```

### 2. **Route Segment Caching**
```typescript
// app/dashboard/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds
```

### 3. **Cache Invalidation**
```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate specific path
revalidatePath('/dashboard')

// Invalidate by tag
revalidateTag('accounts')
```

---

## 📋 Migration Plan

### Phase 1: Remove Redundant Files ❌
- Delete `api-client.ts` (not used)
- Delete `api-cache.ts` (Next.js handles caching)

### Phase 2: Enhance API Service ✅
- Keep as single source of truth for backend communication
- Leverage Next.js caching via `next.revalidate` and `tags`
- Add client-side wrapper for client components

### Phase 3: Refactor Zustand Store 🎨
**NEW ROLE:** UI state only (not data caching)
- Selected items (e.g., selected account, selected transaction)
- UI toggles (modals, sidebars, dropdowns)
- Form state (unsaved changes)
- View preferences (expanded/collapsed, sort order)
- Temporary UI data (loading indicators, error messages)

**REMOVE:** API data storage
- ❌ accounts, transactions, budget (fetched fresh via api-service)
- ❌ user data (fetched via session)

---

## 🏗️ New Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYERS                        │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  1. UI COMPONENTS (Client/Server)                        │
│     - Server Components: Direct api-service calls        │
│     - Client Components: Via client wrapper              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├───────────────┬────────────────┐
                 │               │                │
        ┌────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
        │  API Service │  │   Zustand   │  │  Next.js    │
        │  (Data)      │  │  (UI State) │  │  (Caching)  │
        ├──────────────┤  ├─────────────┤  ├─────────────┤
        │ • Session    │  │ • Selected  │  │ • Fetch     │
        │ • Accounts   │  │   account   │  │   cache     │
        │ • Budget     │  │ • Modals    │  │ • Route     │
        │ • Settings   │  │ • Sidebar   │  │   cache     │
        │ • Mutations  │  │ • Filters   │  │ • Tags      │
        └──────┬───────┘  └─────────────┘  └──────┬──────┘
               │                                   │
               │         BACKEND API              │
               └───────────┬──────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Express.js     │
                  │  Backend        │
                  └─────────────────┘
```

---

## 📝 Implementation Details

### 1. API Service Structure

```typescript
// api-service.ts

'use server' // Server actions

import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import config from '../config'

const BACKEND_URL = config.BACKEND_URL

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

const CACHE = {
  SESSION: { next: { revalidate: 300, tags: ['session'] } },
  ACCOUNTS: { next: { revalidate: 300, tags: ['accounts'] } },
  TRANSACTIONS: { next: { revalidate: 120, tags: ['transactions'] } },
  BUDGET: { next: { revalidate: 300, tags: ['budget'] } },
  SETTINGS: { next: { revalidate: 600, tags: ['settings'] } },
  NONE: { cache: 'no-store' as const },
} as const

// ============================================================================
// SERVER-SIDE REQUESTS (for Server Components)
// ============================================================================

async function request(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session-id')?.value

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId && { Cookie: `session-id=${sessionId}` }),
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// DATA FETCHING (Cached by Next.js)
// ============================================================================

export async function getSession() {
  return request('/api/session', { ...CACHE.SESSION })
}

export async function getAccounts(customerId: string) {
  return request(`/api/accounts/${customerId}`, { ...CACHE.ACCOUNTS })
}

export async function getTransactions(customerId: string) {
  return request(`/api/transactions/${customerId}`, { ...CACHE.TRANSACTIONS })
}

export async function getBudget(customerId: string) {
  return request(`/api/budget/${customerId}`, { ...CACHE.BUDGET })
}

// ============================================================================
// MUTATIONS (Invalidate cache after success)
// ============================================================================

export async function updateBudget(customerId: string, data: any) {
  const result = await request(`/api/budget/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...CACHE.NONE,
  })
  
  // Invalidate budget cache
  revalidateTag('budget')
  
  return result
}

export async function logout() {
  const result = await request('/api/auth/logout', {
    method: 'POST',
    ...CACHE.NONE,
  })
  
  // Invalidate all caches
  revalidateTag('session')
  revalidateTag('accounts')
  revalidateTag('transactions')
  revalidateTag('budget')
  
  return result
}
```

### 2. Client-Side Wrapper (for Client Components)

```typescript
// api-service-client.ts

'use client'

import config from '../config'

const BACKEND_URL = config.BACKEND_URL

/**
 * Client-side API calls (no Next.js caching)
 * Use only in Client Components when you need real-time data
 */
export async function fetchClient(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    cache: 'no-store', // No caching for client-side
  })

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// Client-side API functions
export async function logoutClient() {
  return fetchClient('/api/auth/logout', { method: 'POST' })
}

export async function updateBudgetClient(customerId: string, data: any) {
  return fetchClient(`/api/budget/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

### 3. New Zustand Store (UI State Only)

```typescript
// store/index.ts

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // Selected Items
  selectedAccountId: string | null
  selectedTransactionId: string | null
  selectedCategoryId: string | null
  
  // UI Toggles
  isSidebarOpen: boolean
  isModalOpen: boolean
  modalType: 'add-account' | 'edit-budget' | 'settings' | null
  
  // View Preferences
  dashboardView: 'grid' | 'list'
  transactionsSortBy: 'date' | 'amount' | 'category'
  transactionsSortOrder: 'asc' | 'desc'
  
  // Filters
  dateRange: { start: Date | null; end: Date | null }
  categoryFilter: string[]
  
  // Temporary UI Data
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  
  // Actions
  setSelectedAccount: (id: string | null) => void
  setSelectedTransaction: (id: string | null) => void
  toggleSidebar: () => void
  openModal: (type: UIState['modalType']) => void
  closeModal: () => void
  setDashboardView: (view: 'grid' | 'list') => void
  setTransactionsSort: (by: string, order: 'asc' | 'desc') => void
  setDateRange: (start: Date | null, end: Date | null) => void
  addCategoryFilter: (category: string) => void
  removeCategoryFilter: (category: string) => void
  clearFilters: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  clearToast: () => void
  reset: () => void
}

const initialState = {
  selectedAccountId: null,
  selectedTransactionId: null,
  selectedCategoryId: null,
  isSidebarOpen: true,
  isModalOpen: false,
  modalType: null,
  dashboardView: 'grid' as const,
  transactionsSortBy: 'date' as const,
  transactionsSortOrder: 'desc' as const,
  dateRange: { start: null, end: null },
  categoryFilter: [],
  toast: null,
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setSelectedAccount: (id) => set({ selectedAccountId: id }),
      setSelectedTransaction: (id) => set({ selectedTransactionId: id }),
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      openModal: (type) => set({ isModalOpen: true, modalType: type }),
      closeModal: () => set({ isModalOpen: false, modalType: null }),
      
      setDashboardView: (view) => set({ dashboardView: view }),
      
      setTransactionsSort: (by, order) => set({
        transactionsSortBy: by as any,
        transactionsSortOrder: order,
      }),
      
      setDateRange: (start, end) => set({ dateRange: { start, end } }),
      
      addCategoryFilter: (category) => set((state) => ({
        categoryFilter: [...state.categoryFilter, category],
      })),
      
      removeCategoryFilter: (category) => set((state) => ({
        categoryFilter: state.categoryFilter.filter((c) => c !== category),
      })),
      
      clearFilters: () => set({
        dateRange: { start: null, end: null },
        categoryFilter: [],
      }),
      
      showToast: (message, type) => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
      
      reset: () => set(initialState),
    }),
    { name: 'UI Store' }
  )
)
```

### 4. Component Usage Examples

#### Server Component (Recommended)

```typescript
// app/dashboard/page.tsx

import { getSession, getAccounts, getTransactions } from '@/lib/api-service'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // All cached by Next.js automatically
  const session = await getSession()
  
  if (!session?.user) {
    redirect('/login')
  }

  const [accounts, transactions] = await Promise.all([
    getAccounts(session.user.customerId),
    getTransactions(session.user.customerId),
  ])

  return (
    <div>
      <h1>Welcome, {session.user.firstName}!</h1>
      <AccountsList accounts={accounts} />
      <TransactionsList transactions={transactions} />
    </div>
  )
}
```

#### Client Component (When Needed)

```typescript
// components/budget-form.tsx

'use client'

import { useState } from 'react'
import { updateBudgetClient } from '@/lib/api-service-client'
import { useUIStore } from '@/store'
import { useRouter } from 'next/navigation'

export function BudgetForm({ customerId }: { customerId: string }) {
  const [amount, setAmount] = useState('')
  const { showToast, closeModal } = useUIStore()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      await updateBudgetClient(customerId, { amount: parseFloat(amount) })
      
      showToast('Budget updated successfully!', 'success')
      closeModal()
      
      // Refresh the page data (triggers revalidation)
      router.refresh()
    } catch (error) {
      showToast('Failed to update budget', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  )
}
```

#### UI State Usage

```typescript
// components/accounts-list.tsx

'use client'

import { useUIStore } from '@/store'

export function AccountsList({ accounts }: { accounts: Account[] }) {
  const { selectedAccountId, setSelectedAccount, dashboardView } = useUIStore()

  return (
    <div className={dashboardView === 'grid' ? 'grid' : 'list'}>
      {accounts.map((account) => (
        <div
          key={account.id}
          className={selectedAccountId === account.id ? 'selected' : ''}
          onClick={() => setSelectedAccount(account.id)}
        >
          {account.name}: ${account.balance}
        </div>
      ))}
    </div>
  )
}
```

---

## 🎯 Migration Steps

### Step 1: Delete Redundant Files
```bash
rm packages/web/src/lib/api-client.ts
rm packages/web/src/lib/api-cache.ts
```

### Step 2: Update api-service.ts
- Add cache strategies using Next.js `next.revalidate` and `tags`
- Add cache invalidation after mutations using `revalidateTag()`
- Keep server-side functions with `'use server'`

### Step 3: Create api-service-client.ts
- Client-side wrapper for client components
- No caching (Next.js doesn't cache client-side fetches)
- Handles auth redirects

### Step 4: Refactor Zustand Store
- Remove all data slices (accounts, transactions, budget, session)
- Keep only UI state
- Remove localStorage persistence (not needed for UI state)

### Step 5: Update Components
- Server Components: Use api-service directly
- Client Components: Use api-service-client wrapper
- Use Zustand only for UI state (selected items, modals, filters)

### Step 6: Update Documentation
- Document new architecture
- Add examples for server vs client components
- Explain when to use which approach

---

## ✅ Benefits

1. **Simpler Architecture**
   - One source of truth for data (api-service)
   - Clear separation: Next.js caches data, Zustand handles UI
   - No duplicate caching logic

2. **Better Performance**
   - Next.js automatic caching (request deduplication)
   - Granular cache invalidation with tags
   - Less client-side memory usage (no data in Zustand)

3. **Easier Debugging**
   - Data flow is explicit (component → api-service → backend)
   - UI state isolated in Zustand (easy to inspect)
   - Next.js cache visible in DevTools

4. **Scalability**
   - Add new API endpoints without updating store
   - Cache strategies defined per endpoint
   - Server Components reduce client bundle size

---

## 📚 Resources

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zustand Best Practices](https://github.com/pmndrs/zustand#best-practices)
