# API Service Quick Reference Card

**Location:** `/packages/web/src/lib/api-service.ts`  
**Type:** Server-only functions (Next.js Server Actions)  
**Caching:** Next.js 15 automatic with revalidation tags

---

## 🔍 GET Functions (Cached)

| Function | Returns | Cache Tag | Revalidates On |
|----------|---------|-----------|----------------|
| `getSession()` | `SessionUser \| null` | `session` | Login, logout, profile update |
| `getActiveSessions()` | `Array` | `sessions-list` | Logout, logout-all |
| `getAccounts()` | `Account[]` | `accounts` | Tink callback |
| `getTransactions()` | `Transaction[]` | `transactions` | Tink callback |
| `getBudget()` | `Budget \| null` | `budget` | Budget POST/PATCH |
| `getSettings()` | `Settings \| null` | `settings` | Settings POST |
| `getCustomCategories()` | `CustomCategory[]` | `categories` | Category CRUD |

---

## ✏️ Mutation Functions (Server Actions)

### Authentication
```typescript
login(email, password)              // Revalidates: session
signup(userData)                    // No revalidation
logout()                            // Revalidates: session, sessions-list
logoutAll()                         // Revalidates: session, sessions-list
verifyEmail(token)                  // Revalidates: session
resendVerificationEmail(email)      // No revalidation
```

### Budget
```typescript
updateBudget(limit, categories, period?)  // POST - Full replacement
patchBudget(updates)                      // PATCH - Partial update
// Both revalidate: budget, session
```

### Settings
```typescript
updateSettings(settings)           // Revalidates: settings, session
deleteAccount()                    // Revalidates: ALL tags
```

### Categories
```typescript
createCustomCategory(categoryData)       // Revalidates: categories
updateCustomCategory(id, updates)        // Revalidates: categories
deleteCustomCategory(id)                 // Revalidates: categories
```

### User Profile
```typescript
updateUserProfile(customerId, updates)   // Revalidates: session, budget
getUserByCustomerId(customerId)          // No cache (public endpoint)
```

### Tink
```typescript
processTinkCallback(code)                // Revalidates: accounts, transactions
```

---

## 📋 Usage Examples

### Server Component (Recommended)
```typescript
import { getSession, getAccounts } from '@/lib/api-service'

export default async function Page() {
  const [session, accounts] = await Promise.all([
    getSession(),
    getAccounts()
  ])
  
  return <div>...</div>
}
```

### Client Component with Server Action
```typescript
'use client'
import { updateBudget } from '@/lib/api-service'
import { useRouter } from 'next/navigation'

export function Form() {
  const router = useRouter()
  
  async function handleSubmit() {
    const result = await updateBudget(5000, [])
    if (result.success) {
      router.refresh() // Trigger re-render
    }
  }
  
  return <form action={handleSubmit}>...</form>
}
```

---

## 🎯 Quick Tips

### ✅ Do
- Use in Server Components for automatic caching
- Call `router.refresh()` after mutations in Client Components
- Use `Promise.all()` for parallel fetching
- Let Next.js handle caching automatically

### ❌ Don't
- Use in Client Components for data fetching (use Server Components instead)
- Manually manage cache (Next.js does this)
- Wrap in try/catch (functions return safe defaults)
- Use `api-client.ts` or `api-cache.ts` (deleted)

---

## 🔄 Cache Flow

```
1. getAccounts() called
   ↓
2. Check Next.js cache (tag: 'accounts')
   ↓
3. If cached: Return cached data
   If not: Fetch from backend + cache
   ↓
4. updateBudget() called
   ↓
5. POST to backend
   ↓
6. revalidateTag('budget')
   ↓
7. Next.js invalidates cache
   ↓
8. router.refresh()
   ↓
9. Server Component re-renders
   ↓
10. getBudget() fetches fresh data
```

---

## 🏷️ Cache Tags

| Tag | Cached Resources |
|-----|------------------|
| `session` | User session data, profile info |
| `sessions-list` | All active sessions for user |
| `accounts` | All user accounts |
| `transactions` | All user transactions |
| `budget` | Budget data and categories |
| `settings` | User preferences and settings |
| `categories` | Custom categories |

---

## 🔐 Authentication

All functions automatically forward the `session-id` cookie:

```typescript
// Handled internally by serverFetch()
const cookieStore = await cookies()
const sessionId = cookieStore.get('session-id')?.value
headers.set('Cookie', `session-id=${sessionId}`)
```

No manual auth headers needed! 🎉

---

## 📦 Type Safety

```typescript
import type {
  Account,
  Transaction,
  Budget,
  CustomCategory,
  CategoryBudget,
  BudgetPeriod,
} from '@money-mapper/shared'

import type { UserSettings } from '@/lib/default-settings'

// Session user type (from backend)
export interface SessionUser {
  customerId: string
  email: string
  firstName: string
  lastName: string
  name: string
  currency: string
  totalBudgetLimit: number
}
```

---

## 🚨 Error Handling

All functions handle errors gracefully:

```typescript
// GET functions return safe defaults
const accounts = await getAccounts()
// If error: accounts = []

// Mutation functions return success flag
const result = await updateBudget(5000, [])
if (!result.success) {
  console.error(result.message)
}
```

No try/catch needed! 🛡️

---

## 📚 Related Files

- **Server-side API:** `/packages/web/src/lib/api-service.ts` ⭐
- **Client-side API:** `/packages/web/src/lib/api-service-client.ts`
- **UI State:** `/packages/web/src/store/ui-store.ts`
- **Config:** `/packages/web/src/config.ts`
- **Types:** `/packages/shared/src/types/`

---

## 📖 Documentation

- [Full API Reference](./API_SERVICE_REFERENCE.md) - Detailed docs
- [Backend Routes Mapping](./BACKEND_ROUTES_MAPPING.md) - Route details
- [Architecture Guide](./ARCHITECTURE_MIGRATION.md) - Migration overview
- [Phase 1 Complete](../PHASE_1_COMPLETE.md) - Project status

---

**Print this card and keep it handy!** 🎯
