# Where is the UI Store Used?

## Answer: **NOWHERE YET** ✅

The UI store (`useUIStore`) is **defined and ready** but **not actively used** in any components yet.

---

## Current State

### ✅ What Exists

**UI Store Definition:**
- `/store/ui-store.ts` - Fully defined UI state store
- `/store/index.ts` - Clean export

**Available Hooks:**
```typescript
// Main store hook
import { useUIStore } from '@/store'

// Specialized hooks
import { 
  useSelectedItems,  // For selected account/transaction/category
  useModal,          // For modal state
  useFilters,        // For date/category/search filters
  useToasts          // For toast notifications
} from '@/store/ui-store'
```

### ❌ What Doesn't Exist Anymore

All data caching has been removed:
- ❌ `useAccountsData()` - Deleted
- ❌ `useTransactionsData()` - Deleted
- ❌ `useBudgetData()` - Deleted
- ❌ All data slices - Deleted

---

## Why UI Store Isn't Used Yet

### Current Pattern: Server Components Pass Props

All your Client Components receive data via **props** from Server Components:

```typescript
// ✅ Server Component
async function DashboardPage() {
  const accounts = await getAccounts()
  return <DashboardClient accounts={accounts} />
}

// ✅ Client Component
function DashboardClient({ accounts }: { accounts: Account[] }) {
  // Uses accounts from props, no Zustand needed yet
  return <div>{accounts.length} accounts</div>
}
```

This works perfectly for **displaying data**, but UI state management isn't implemented yet.

---

## When You SHOULD Use UI Store

The UI store should be used for:

### 1. **Selected Items**

```typescript
'use client'
import { useUIStore } from '@/store'

function TransactionsList({ transactions }) {
  const selectedId = useUIStore(state => state.selectedTransactionId)
  const setSelected = useUIStore(state => state.setSelectedTransaction)
  
  return (
    <div>
      {transactions.map(tx => (
        <div 
          key={tx.id}
          onClick={() => setSelected(tx.id)}
          className={selectedId === tx.id ? 'bg-blue-100' : ''}
        >
          {tx.description}
        </div>
      ))}
    </div>
  )
}
```

### 2. **Modal State**

```typescript
'use client'
import { useModal } from '@/store/ui-store'

function Dashboard() {
  const { openModal } = useModal()
  
  return (
    <div>
      <button onClick={() => openModal('add-transaction', { accountId: '123' })}>
        Add Transaction
      </button>
      <TransactionModal />  {/* Modal reads from useModal() */}
    </div>
  )
}

function TransactionModal() {
  const { isOpen, type, data, closeModal } = useModal()
  
  if (!isOpen || type !== 'add-transaction') return null
  
  return (
    <div className="modal">
      <button onClick={closeModal}>Close</button>
      <TransactionForm accountId={data.accountId} />
    </div>
  )
}
```

### 3. **Filters**

```typescript
'use client'
import { useFilters } from '@/store/ui-store'

function TransactionsFilter({ transactions }) {
  const { 
    searchQuery, 
    setSearchQuery, 
    categoryFilter,
    addCategoryFilter,
    clearFilters 
  } = useFilters()
  
  // Filter transactions based on UI state
  const filtered = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (categoryFilter.length === 0 || categoryFilter.includes(tx.category))
  )
  
  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={clearFilters}>Clear Filters</button>
      <div>{filtered.length} results</div>
    </div>
  )
}
```

### 4. **Toasts/Notifications**

```typescript
'use client'
import { useToasts } from '@/store/ui-store'
import { useEffect } from 'react'

function ToastContainer() {
  const { toasts, clearToast } = useToasts()
  
  return (
    <div className="fixed top-4 right-4 space-y-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
          <button onClick={() => clearToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// Show toast from anywhere
function SomeComponent() {
  const { showToast } = useToasts()
  
  const handleSave = async () => {
    await saveData()
    showToast('Saved successfully!', 'success')
  }
  
  return <button onClick={handleSave}>Save</button>
}
```

### 5. **View Preferences**

```typescript
'use client'
import { useUIStore } from '@/store'

function DashboardView({ accounts }) {
  const view = useUIStore(state => state.dashboardView)
  const setView = useUIStore(state => state.setDashboardView)
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setView('grid')}
          className={view === 'grid' ? 'active' : ''}
        >
          Grid
        </button>
        <button 
          onClick={() => setView('list')}
          className={view === 'list' ? 'active' : ''}
        >
          List
        </button>
      </div>
      
      {view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {accounts.map(account => <AccountCard key={account.id} {...account} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(account => <AccountRow key={account.id} {...account} />)}
        </div>
      )}
    </div>
  )
}
```

---

## When You Should NOT Use UI Store

### ❌ Don't Store API Data

```typescript
// ❌ WRONG - Don't cache data in Zustand
const accounts = useUIStore(state => state.accounts)  // accounts shouldn't be in store

// ✅ RIGHT - Get data from props
function MyComponent({ accounts }: { accounts: Account[] }) {
  // Use accounts from props
}
```

### ❌ Don't Fetch Data in Zustand

```typescript
// ❌ WRONG - Don't fetch in hooks/store
useEffect(() => {
  const data = await getAccounts()
  setAccountsInStore(data)
}, [])

// ✅ RIGHT - Fetch in Server Component
async function Page() {
  const accounts = await getAccounts()  // Server-side
  return <Client accounts={accounts} />
}
```

---

## Implementation Checklist

Here are features you can implement using the UI store:

### Ready to Implement:

- [ ] **Transaction selection** - Click to select/highlight transactions
- [ ] **Account selection** - Select active account for filtering
- [ ] **Modal management** - Add/edit transaction modals
- [ ] **Search/filters** - Filter transactions by text/category/date
- [ ] **View toggles** - Grid vs. List view for accounts
- [ ] **Toast notifications** - Success/error messages after actions
- [ ] **Sidebar state** - Mobile menu open/closed
- [ ] **Sort preferences** - Remember how user sorts transactions

### Already Works (No Zustand Needed):

- ✅ **Data display** - Props from Server Components
- ✅ **Data fetching** - Next.js caching
- ✅ **Mutations** - api-service-client functions
- ✅ **Cache invalidation** - revalidateTag()

---

## Example: Adding Transaction Selection

Let me show you how to add your first UI state feature:

### Step 1: Update Client Component

```typescript
// dashboard-client.tsx
'use client'
import { useUIStore } from '@/store'

export default function DashboardClient({ 
  accounts, 
  transactions 
}: DashboardClientProps) {
  const selectedId = useUIStore(state => state.selectedTransactionId)
  const setSelected = useUIStore(state => state.setSelectedTransaction)
  
  return (
    <div>
      <h2>Recent Transactions</h2>
      {transactions.map(tx => (
        <div 
          key={tx.id}
          onClick={() => setSelected(tx.id)}
          className={`
            transaction-card 
            ${selectedId === tx.id ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <div>{tx.description}</div>
          <div>{tx.amount}</div>
        </div>
      ))}
      
      {selectedId && (
        <TransactionDetails 
          transaction={transactions.find(t => t.id === selectedId)!}
        />
      )}
    </div>
  )
}
```

That's it! Now users can:
- Click a transaction to select it
- See it highlighted
- View details panel for selected transaction
- Selection persists across component re-renders

---

## Summary

### Current Status: ✅ Ready But Unused

- **UI Store:** Fully defined and exported
- **Usage:** 0 components currently use it
- **Reason:** Current components work with props-only pattern
- **Next Step:** Implement UI features that need state (selection, modals, filters)

### The Pattern:

```
Data Flow:
Server Component → Props → Client Component
                              ↓
                    UI State (Zustand)
```

### When to Use:

- ✅ Selections
- ✅ Modals
- ✅ Filters
- ✅ View preferences
- ✅ Toasts
- ❌ NOT for data caching

---

**Bottom line:** Your UI store is perfectly set up and ready to use. You just haven't added any UI features that need it yet! Start with something simple like transaction selection or modal management.
