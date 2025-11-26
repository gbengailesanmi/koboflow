# UI Store Quick Reference Card

## Import Statement
```typescript
import { useSelectedItems, useFilters, useModal, useToasts } from '@/store'
```

---

## 1. Selection Management

### useSelectedItems()
```typescript
const { 
  selectedAccountId,        // string | null
  selectedTransactionId,    // string | null
  selectedCategoryId,       // string | null
  setSelectedAccount,       // (id: string | null) => void
  setSelectedTransaction,   // (id: string | null) => void
  setSelectedCategory,      // (id: string | null) => void
  clearSelections           // () => void
} = useSelectedItems()
```

**Example:**
```typescript
// Set selection
setSelectedAccount('account-123')

// Clear selection
setSelectedAccount(null)

// Get selected item
const account = accounts.find(a => a.id === selectedAccountId)
```

---

## 2. Filters Management

### useFilters()
```typescript
const {
  searchQuery,              // string
  categoryFilter,           // string[]
  accountFilter,            // string[]
  dateRange,                // { start: Date | null, end: Date | null }
  amountRangeFilter,        // { min: number | null, max: number | null }
  
  setSearchQuery,           // (query: string) => void
  addCategoryFilter,        // (category: string) => void
  removeCategoryFilter,     // (category: string) => void
  setCategoryFilter,        // (categories: string[]) => void
  addAccountFilter,         // (accountId: string) => void
  removeAccountFilter,      // (accountId: string) => void
  setDateRange,             // (start: Date | null, end: Date | null) => void
  setAmountRangeFilter,     // (min: number | null, max: number | null) => void
  clearFilters              // () => void
} = useFilters()
```

**Example:**
```typescript
// Search
setSearchQuery('coffee')

// Category filter
addCategoryFilter('shopping')
removeCategoryFilter('shopping')

// Clear all
clearFilters()
```

---

## 3. Modal Management

### useModal()
```typescript
const {
  isOpen,                   // boolean
  type,                     // ModalType | null
  data,                     // any
  openModal,                // (type: ModalType, data?: any) => void
  closeModal                // () => void
} = useModal()
```

**Modal Types:**
- `'add-account'`
- `'edit-account'`
- `'delete-account'`
- `'add-transaction'`
- `'edit-transaction'`
- `'delete-transaction'`
- `'edit-budget'`
- `'settings'`

**Example:**
```typescript
// Open modal
openModal('add-account')
openModal('edit-transaction', { transaction })

// Close modal
closeModal()

// Check if open
if (isOpen && type === 'add-account') {
  // Show add account modal
}
```

---

## 4. Toast Notifications

### useToasts()
```typescript
const {
  toasts,                   // Toast[]
  showToast,                // (message: string, type?: ToastType) => void
  clearToast,               // (id: string) => void
  clearAllToasts            // () => void
} = useToasts()
```

**Toast Types:**
- `'success'` - Green, checkmark
- `'error'` - Red, X icon
- `'warning'` - Yellow, warning icon
- `'info'` - Blue, info icon (default)

**Example:**
```typescript
// Show success
showToast('Saved successfully!', 'success')

// Show error
showToast('Failed to save', 'error')

// Show info (default)
showToast('Processing...')

// Clear specific toast
clearToast(toast.id)

// Clear all
clearAllToasts()
```

---

## Common Patterns

### 1. Account Selector with Persistence
```typescript
'use client'
import { useSelectedItems } from '@/store'

function AccountSelector({ accounts }) {
  const { selectedAccountId, setSelectedAccount } = useSelectedItems()
  
  return (
    <select 
      value={selectedAccountId || 'all'}
      onChange={(e) => setSelectedAccount(
        e.target.value === 'all' ? null : e.target.value
      )}
    >
      <option value="all">All Accounts</option>
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>{acc.name}</option>
      ))}
    </select>
  )
}
```

### 2. Search with Filter
```typescript
'use client'
import { useFilters } from '@/store'

function SearchBar() {
  const { searchQuery, setSearchQuery } = useFilters()
  
  return (
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

### 3. Save Operation with Toast
```typescript
'use client'
import { useToasts } from '@/store'

function SaveButton() {
  const { showToast } = useToasts()
  
  const handleSave = async () => {
    try {
      await saveData()
      showToast('Saved successfully!', 'success')
      router.refresh()
    } catch (error) {
      showToast('Save failed. Please try again.', 'error')
    }
  }
  
  return <button onClick={handleSave}>Save</button>
}
```

### 4. Transaction Selection (Store ID, Not Object)
```typescript
'use client'
import { useSelectedItems } from '@/store'

function TransactionList({ transactions }) {
  const { selectedTransactionId, setSelectedTransaction } = useSelectedItems()
  
  // Get the actual transaction object
  const selectedTransaction = transactions.find(
    txn => txn.id === selectedTransactionId
  )
  
  return (
    <div>
      {transactions.map(txn => (
        <div 
          key={txn.id}
          onClick={() => setSelectedTransaction(txn.id)}
          className={txn.id === selectedTransactionId ? 'selected' : ''}
        >
          {txn.description}
        </div>
      ))}
      
      {selectedTransaction && (
        <Modal>
          <TransactionDetails transaction={selectedTransaction} />
        </Modal>
      )}
    </div>
  )
}
```

---

## Best Practices

### ✅ DO
- Store only IDs in Zustand (not full objects)
- Look up full objects from props data
- Use toasts for user feedback
- Clear filters when appropriate
- Keep store lightweight

### ❌ DON'T
- Don't store API data in Zustand
- Don't cache transactions/accounts
- Don't store derived data
- Don't use for server state
- Don't duplicate data from props

---

## Where is the Store Used?

| Component | Hook(s) Used | Purpose |
|-----------|--------------|---------|
| Dashboard | `useSelectedItems()` | Account selection |
| Transactions | `useSelectedItems()`, `useFilters()` | Transaction selection, search, filters |
| Budget | `useToasts()` | Save feedback |
| Analytics | `useSelectedItems()`, `useToasts()` | Account selection, category operations |
| Profile | `useToasts()` | Update feedback |
| Settings | `useToasts()` | Settings operations feedback |

---

## Store State Shape

```typescript
{
  // Selected Items
  selectedAccountId: string | null,
  selectedTransactionId: string | null,
  selectedCategoryId: string | null,
  
  // UI Toggles
  isSidebarOpen: boolean,
  isMobileMenuOpen: boolean,
  isModalOpen: boolean,
  modalType: ModalType | null,
  modalData: any,
  
  // View Preferences
  dashboardView: 'grid' | 'list',
  transactionsSortBy: 'date' | 'amount' | 'category' | 'description',
  transactionsSortOrder: 'asc' | 'desc',
  accountsView: 'carousel' | 'row' | 'grid',
  
  // Filters
  dateRange: { start: Date | null, end: Date | null },
  categoryFilter: string[],
  accountFilter: string[],
  amountRangeFilter: { min: number | null, max: number | null },
  searchQuery: string,
  
  // Toasts
  toasts: Array<{ id: string, message: string, type: ToastType }>
}
```

---

## Quick Debugging

```typescript
// In browser console
window.__ZUSTAND_DEVTOOLS__ = true

// Or in component
import { useUIStore } from '@/store'

function Debug() {
  const state = useUIStore()
  console.log('Store State:', state)
  return null
}
```

---

**Last Updated:** November 16, 2025
