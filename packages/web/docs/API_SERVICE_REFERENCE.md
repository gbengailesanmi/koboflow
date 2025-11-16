# API Service Reference

Complete reference for `/packages/web/src/lib/api-service.ts` - Server-side API functions for Next.js 15.

## Table of Contents

1. [Architecture](#architecture)
2. [Helper Functions](#helper-functions)
3. [GET Functions (Cached)](#get-functions-cached)
4. [Mutation Functions (Server Actions)](#mutation-functions-server-actions)
5. [Cache Strategy](#cache-strategy)
6. [Usage Examples](#usage-examples)

---

## Architecture

### Design Principles

1. **Server-Only Functions**: All functions use `'use server'` directive
2. **Automatic Session Forwarding**: Cookie-based session authentication
3. **Next.js 15 Caching**: Built-in `fetch()` caching with revalidation tags
4. **Type Safety**: Full TypeScript types from `@money-mapper/shared`
5. **Error Handling**: Graceful fallbacks, never throws in components

### Data Flow

```
Server Component → api-service.ts (cached) → Backend API
     ↓
Client Component → api-service-client.ts → router.refresh() → Server Component re-renders
```

---

## Helper Functions

### `serverFetch(url, options)`

Internal helper for all API requests.

**Features:**
- Automatically forwards `session-id` cookie from Next.js context
- Sets default JSON `Content-Type` header
- Enables `credentials: 'include'` for cookies
- Defaults to `cache: 'force-cache'` for Next.js 15 caching

**Example:**
```typescript
const response = await serverFetch(`${BACKEND_URL}/api/accounts`, {
  next: { tags: ['accounts'] },
})
```

### `parseResponse<T>(response)`

Parses JSON response with error handling.

**Throws:** Error with backend message on non-2xx status

---

## GET Functions (Cached)

All GET functions use Next.js 15's automatic caching with revalidation tags.

### Session / Authentication

#### `getSession(): Promise<SessionUser | null>`

**Backend:** `GET /api/session`  
**Cache Tag:** `'session'`  
**Revalidates After:** Login, logout, profile updates

**Returns:**
```typescript
{
  customerId: string
  email: string
  firstName: string
  lastName: string
  name: string
  currency: string
  totalBudgetLimit: number
}
```

**Usage:**
```typescript
// In Server Component
import { getSession } from '@/lib/api-service'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  
  return <h1>Welcome {session.name}</h1>
}
```

---

#### `getActiveSessions(): Promise<any[]>`

**Backend:** `GET /api/auth/sessions`  
**Cache Tag:** `'sessions-list'`  
**Revalidates After:** Logout, logout-all

**Returns:** Array of active session objects

---

### Accounts

#### `getAccounts(): Promise<Account[]>`

**Backend:** `GET /api/accounts`  
**Cache Tag:** `'accounts'`  
**Revalidates After:** Tink callback imports

**Usage:**
```typescript
import { getAccounts } from '@/lib/api-service'

export default async function AccountsPage() {
  const accounts = await getAccounts()
  
  return (
    <ul>
      {accounts.map(account => (
        <li key={account.accountId}>{account.name}: {account.balance}</li>
      ))}
    </ul>
  )
}
```

---

### Transactions

#### `getTransactions(): Promise<Transaction[]>`

**Backend:** `GET /api/transactions`  
**Cache Tag:** `'transactions'`  
**Revalidates After:** Create, update, delete transaction, Tink callback

**Returns:** Sorted by `bookedDate` descending

---

### Budget

#### `getBudget(): Promise<Budget | null>`

**Backend:** `GET /api/budget`  
**Cache Tag:** `'budget'`  
**Revalidates After:** Budget POST or PATCH

**Returns:**
```typescript
{
  customerId: string
  totalBudgetLimit: number
  categories: CategoryBudget[]
  period?: BudgetPeriod
  createdAt: Date
  updatedAt: Date
}
```

---

### Settings

#### `getSettings(): Promise<Settings | null>`

**Backend:** `GET /api/settings`  
**Cache Tag:** `'settings'`  
**Revalidates After:** Settings POST

---

### Categories

#### `getCustomCategories(): Promise<CustomCategory[]>`

**Backend:** `GET /api/categories`  
**Cache Tag:** `'categories'`  
**Revalidates After:** Category POST, PATCH, DELETE

---

## Mutation Functions (Server Actions)

All mutation functions use `cache: 'no-store'` and trigger cache revalidation.

### Authentication

#### `login(email, password)`

**Backend:** `POST /api/auth/login`  
**Revalidates:** `'session'`

**Returns:**
```typescript
{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}
```

**Usage:**
```typescript
'use client'
import { login } from '@/lib/api-service'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  
  async function handleLogin(formData: FormData) {
    const result = await login(
      formData.get('email') as string,
      formData.get('password') as string
    )
    
    if (result.success) {
      router.push(`/${result.user.customerId}/dashboard`)
      router.refresh() // Trigger server component re-render
    }
  }
  
  return <form action={handleLogin}>...</form>
}
```

---

#### `signup(userData)`

**Backend:** `POST /api/auth/signup`  
**Revalidates:** None (email verification required)

**Parameters:**
```typescript
{
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}
```

---

#### `logout()`

**Backend:** `POST /api/auth/logout`  
**Revalidates:** `'session'`, `'sessions-list'`

**Usage:**
```typescript
'use client'
import { logout } from '@/lib/api-service'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  
  async function handleLogout() {
    const result = await logout()
    if (result.success) {
      router.push('/login')
      router.refresh()
    }
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

---

#### `logoutAll()`

**Backend:** `POST /api/auth/logout-all`  
**Revalidates:** `'session'`, `'sessions-list'`

Logs out from all devices (deletes all user sessions).

---

#### `verifyEmail(token)`

**Backend:** `POST /api/auth/verify-email`  
**Revalidates:** `'session'`

**Usage:**
```typescript
// In verify page
const result = await verifyEmail(token)
if (result.success) {
  redirect('/login')
}
```

---

#### `resendVerificationEmail(email)`

**Backend:** `POST /api/auth/resend-verification`  
**Revalidates:** None

---

### Budget

#### `updateBudget(totalBudgetLimit, categories, period?)`

**Backend:** `POST /api/budget`  
**Revalidates:** `'budget'`, `'session'`

**Full replacement** of budget. Use for creating new budget or complete overwrite.

**Parameters:**
```typescript
totalBudgetLimit: number
categories: CategoryBudget[]
period?: BudgetPeriod
```

**Usage:**
```typescript
'use server'
import { updateBudget } from '@/lib/api-service'
import { revalidatePath } from 'next/cache'

export async function saveBudget(formData: FormData) {
  const result = await updateBudget(
    Number(formData.get('totalLimit')),
    JSON.parse(formData.get('categories') as string),
    JSON.parse(formData.get('period') as string)
  )
  
  if (result.success) {
    revalidatePath('/[customerId]/budget')
  }
  
  return result
}
```

---

#### `patchBudget(updates)`

**Backend:** `PATCH /api/budget`  
**Revalidates:** `'budget'`, `'session'`

**Partial update** of budget. Only updates provided fields.

**Parameters:**
```typescript
{
  totalBudgetLimit?: number
  categories?: CategoryBudget[]
  period?: BudgetPeriod
}
```

**Usage:**
```typescript
// Update only categories without changing total limit
await patchBudget({
  categories: updatedCategories
})
```

---

### Settings

#### `updateSettings(settings)`

**Backend:** `POST /api/settings`  
**Revalidates:** `'settings'`, `'session'`

**Parameters:** Partial `Settings` object

**Usage:**
```typescript
await updateSettings({
  currency: 'USD',
  theme: 'dark'
})
```

---

#### `deleteAccount()`

**Backend:** `DELETE /api/settings/account`  
**Revalidates:** All tags (deletes user and all data)

⚠️ **Destructive operation** - deletes user account and all associated data.

---

### Categories

#### `createCustomCategory(categoryData)`

**Backend:** `POST /api/categories`  
**Revalidates:** `'categories'`

**Parameters:**
```typescript
{
  name: string
  keywords: string[]
  color?: string
}
```

**Returns:** `CustomCategory | null`

---

#### `updateCustomCategory(categoryId, updates)`

**Backend:** `PATCH /api/categories/:id`  
**Revalidates:** `'categories'`

**Parameters:**
```typescript
categoryId: string
updates: {
  name?: string
  keywords?: string[]
  color?: string
}
```

---

#### `deleteCustomCategory(categoryId)`

**Backend:** `DELETE /api/categories/:id`  
**Revalidates:** `'categories'`

---

### User Profile

#### `updateUserProfile(customerId, updates)`

**Backend:** `PATCH /api/auth/user/:customerId`  
**Revalidates:** `'session'`, optionally `'budget'`

**Parameters:**
```typescript
customerId: string
updates: {
  firstName?: string
  lastName?: string
  email?: string
  currency?: string
  totalBudgetLimit?: number
}
```

---

#### `getUserByCustomerId(customerId)`

**Backend:** `GET /api/auth/user/:customerId`  
**Cache:** No cache (`no-store`)

Used for OAuth flows. Public endpoint.

---

### Tink Integration

#### `processTinkCallback(code)`

**Backend:** `GET /api/callback?code={code}`  
**Revalidates:** `'accounts'`, `'transactions'`

Imports accounts and transactions from Tink OAuth callback.

**Usage:**
```typescript
// In callback route handler
const result = await processTinkCallback(searchParams.code)
if (result.success) {
  redirect(`/${customerId}/dashboard`)
}
```

---

## Cache Strategy

### Next.js 15 Caching

All GET functions use Next.js 15's built-in `fetch()` caching:

```typescript
fetch(url, {
  cache: 'force-cache', // Default for GET requests
  next: { tags: ['tag-name'] }
})
```

### Revalidation Tags

| Tag | Revalidates On | Affects |
|-----|---------------|---------|
| `session` | Login, logout, profile update | Session user data |
| `sessions-list` | Logout, logout-all | Active sessions list |
| `accounts` | Tink callback | All accounts |
| `transactions` | CRUD ops, Tink callback | All transactions |
| `budget` | Budget POST/PATCH | Budget data |
| `settings` | Settings POST | User settings |
| `categories` | Category CRUD | Custom categories |

### Manual Revalidation

```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

// Revalidate specific cache tag
revalidateTag('accounts')

// Revalidate entire page/route
revalidatePath('/[customerId]/dashboard')
```

---

## Usage Examples

### Server Component (Recommended)

```typescript
// app/[customerId]/dashboard/page.tsx
import { getSession, getAccounts, getBudget } from '@/lib/api-service'

export default async function DashboardPage() {
  // All fetches run in parallel, cached automatically
  const [session, accounts, budget] = await Promise.all([
    getSession(),
    getAccounts(),
    getBudget()
  ])

  if (!session) redirect('/login')

  return (
    <div>
      <h1>Welcome {session.name}</h1>
      <AccountsList accounts={accounts} />
      <BudgetOverview budget={budget} />
    </div>
  )
}
```

### Client Component with Server Action

```typescript
// app/components/UpdateBudgetForm.tsx
'use client'
import { updateBudget } from '@/lib/api-service'
import { useRouter } from 'next/navigation'

export function UpdateBudgetForm({ budget }: { budget: Budget }) {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await updateBudget(
      Number(formData.get('limit')),
      JSON.parse(formData.get('categories') as string)
    )

    if (result.success) {
      router.refresh() // Trigger server component re-render
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="limit" type="number" defaultValue={budget.totalBudgetLimit} />
      {/* ... */}
      <button type="submit">Save Budget</button>
    </form>
  )
}
```

### Parallel Data Fetching

```typescript
// Fetch multiple resources in parallel (cached by Next.js)
const [accounts, transactions, categories] = await Promise.all([
  getAccounts(),
  getTransactions(),
  getCustomCategories()
])
```

---

## Error Handling

All functions handle errors gracefully:

- **GET functions**: Return empty arrays or `null` on error
- **Mutation functions**: Return `{ success: false, message: string }`
- Never throws in components - safe to use without try/catch

**Example:**
```typescript
const accounts = await getAccounts()
// If error: accounts = []
// No need for try/catch

const result = await updateBudget(5000, [])
if (!result.success) {
  showToast(result.message || 'Failed to update budget')
}
```

---

## Migration Notes

### From Old Pattern (api-client.ts)

**Before:**
```typescript
import { getAccounts } from '@/lib/api-client'

// Client-side fetch, no caching
const accounts = await getAccounts()
```

**After:**
```typescript
import { getAccounts } from '@/lib/api-service'

// Server-side fetch, automatically cached
const accounts = await getAccounts()
```

### Client Component Usage

**Before:**
```typescript
'use client'
const [accounts, setAccounts] = useState([])

useEffect(() => {
  getAccounts().then(setAccounts)
}, [])
```

**After:**
```typescript
// Pass data from Server Component as prop
export default function AccountsList({ accounts }: { accounts: Account[] }) {
  return <ul>{accounts.map(...)}</ul>
}

// Or use api-service-client.ts for client-side mutations
import { getAccountsClient } from '@/lib/api-service-client'
```

---

## Related Documentation

- [api-service-client.ts Reference](./API_SERVICE_CLIENT_REFERENCE.md) - Client-side mutations
- [ui-store.ts Reference](./UI_STORE_REFERENCE.md) - UI-only state management
- [Architecture Migration Guide](./ARCHITECTURE_MIGRATION.md) - Full migration overview
