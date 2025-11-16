# Backend API Routes → Frontend Functions Mapping

Complete mapping of all backend API endpoints to their corresponding frontend API service functions.

**Last Updated:** After migration to server-side sessions and Next.js 15 caching

---

## Quick Reference Table

| HTTP Method | Backend Route | Frontend Function | Cache Tag |
|-------------|---------------|-------------------|-----------|
| **Authentication** |
| POST | `/api/auth/signup` | `signup()` | - |
| POST | `/api/auth/login` | `login()` | `session` |
| POST | `/api/auth/logout` | `logout()` | `session`, `sessions-list` |
| POST | `/api/auth/logout-all` | `logoutAll()` | `session`, `sessions-list` |
| GET | `/api/auth/sessions` | `getActiveSessions()` | `sessions-list` |
| GET | `/api/auth/verify-email` | N/A (handled by route) | - |
| POST | `/api/auth/verify-email` | `verifyEmail()` | `session` |
| POST | `/api/auth/resend-verification` | `resendVerificationEmail()` | - |
| POST | `/api/auth/oauth-user` | N/A (internal OAuth) | - |
| GET | `/api/auth/user/:customerId` | `getUserByCustomerId()` | - |
| PATCH | `/api/auth/user/:customerId` | `updateUserProfile()` | `session`, `budget` |
| GET | `/api/auth/google` | N/A (redirect flow) | - |
| GET | `/api/auth/google/callback` | N/A (OAuth callback) | - |
| **Session** |
| GET | `/api/session` | `getSession()` | `session` |
| DELETE | `/api/session` | `logout()` (alias) | `session`, `sessions-list` |
| **Accounts** |
| GET | `/api/accounts` | `getAccounts()` | `accounts` |
| **Transactions** |
| GET | `/api/transactions` | `getTransactions()` | `transactions` |
| **Budget** |
| GET | `/api/budget` | `getBudget()` | `budget` |
| POST | `/api/budget` | `updateBudget()` | `budget`, `session` |
| PATCH | `/api/budget` | `patchBudget()` | `budget`, `session` |
| **Settings** |
| GET | `/api/settings` | `getSettings()` | `settings` |
| POST | `/api/settings` | `updateSettings()` | `settings`, `session` |
| DELETE | `/api/settings/account` | `deleteAccount()` | All tags |
| **Categories** |
| GET | `/api/categories` | `getCustomCategories()` | `categories` |
| POST | `/api/categories` | `createCustomCategory()` | `categories` |
| PATCH | `/api/categories/:id` | `updateCustomCategory()` | `categories` |
| DELETE | `/api/categories/:id` | `deleteCustomCategory()` | `categories` |
| **Tink Integration** |
| GET | `/api/callback` | `processTinkCallback()` | `accounts`, `transactions` |

---

## Detailed Mapping

### 1. Authentication Routes (`/api/auth/*`)

#### POST `/api/auth/signup`

**Backend:** `packages/backend/src/routes/auth.ts:13`

**Frontend Function:**
```typescript
signup(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
}>
```

**Behavior:**
- Creates user account
- Sends verification email
- Does NOT create session (email verification required)
- No cache revalidation

**Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "message": "Account created! Please check your email to verify your account."
}
```

---

#### POST `/api/auth/login`

**Backend:** `packages/backend/src/routes/auth.ts:84`

**Frontend Function:**
```typescript
login(email: string, password: string): Promise<{
  success: boolean
  message?: string
  requiresVerification?: boolean
  user?: any
}>
```

**Behavior:**
- Validates credentials
- Creates server-side session (MongoDB)
- Sets `session-id` cookie (7-day expiry)
- Revalidates: `session` tag

**Response:**
```json
{
  "success": true,
  "user": {
    "customerId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

#### POST `/api/auth/logout`

**Backend:** `packages/backend/src/routes/auth.ts:152`

**Frontend Function:**
```typescript
logout(): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- Deletes current session from MongoDB
- Clears `session-id` cookie
- Revalidates: `session`, `sessions-list` tags

**Use Case:** Single device logout

---

#### POST `/api/auth/logout-all`

**Backend:** `packages/backend/src/routes/auth.ts:182`

**Frontend Function:**
```typescript
logoutAll(): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- Deletes ALL sessions for user from MongoDB
- Clears `session-id` cookie
- Revalidates: `session`, `sessions-list` tags

**Use Case:** Multi-device logout (security feature)

**Response:**
```json
{
  "success": true,
  "message": "Logged out from 3 device(s)"
}
```

---

#### GET `/api/auth/sessions`

**Backend:** `packages/backend/src/routes/auth.ts:214`

**Frontend Function:**
```typescript
getActiveSessions(): Promise<any[]>
```

**Behavior:**
- Returns all active sessions for current user
- Includes device info (userAgent, IP)
- Marks current session with `isCurrent: true`
- Cache tag: `sessions-list`

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastAccessedAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "127.0.0.1",
      "isCurrent": true
    }
  ]
}
```

---

#### POST `/api/auth/verify-email`

**Backend:** `packages/backend/src/routes/auth.ts:311`

**Frontend Function:**
```typescript
verifyEmail(token: string): Promise<{
  success: boolean
  message?: string
  customerId?: string
}>
```

**Behavior:**
- Verifies email with token
- Updates `emailVerified: true`
- Removes verification token from DB
- Revalidates: `session` tag

---

#### POST `/api/auth/resend-verification`

**Backend:** `packages/backend/src/routes/auth.ts:377`

**Frontend Function:**
```typescript
resendVerificationEmail(email: string): Promise<{
  success: boolean
  message?: string
}>
```

**Behavior:**
- Generates new verification token
- Sends new verification email
- Does not reveal if email exists (security)

---

#### PATCH `/api/auth/user/:customerId`

**Backend:** `packages/backend/src/routes/auth.ts:576`

**Frontend Function:**
```typescript
updateUserProfile(
  customerId: string,
  updates: {
    firstName?: string
    lastName?: string
    email?: string
    currency?: string
    totalBudgetLimit?: number
  }
): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- Updates user profile fields
- Updates budget if `totalBudgetLimit` provided
- Checks email uniqueness
- Revalidates: `session`, optionally `budget`

---

#### GET `/api/auth/user/:customerId`

**Backend:** `packages/backend/src/routes/auth.ts:536`

**Frontend Function:**
```typescript
getUserByCustomerId(customerId: string): Promise<{
  success: boolean
  user?: any
  message?: string
}>
```

**Behavior:**
- Public endpoint (no auth required)
- Used for OAuth flows
- No caching

---

### 2. Session Routes (`/api/session`)

#### GET `/api/session`

**Backend:** `packages/backend/src/routes/session.ts:9`

**Frontend Function:**
```typescript
getSession(): Promise<SessionUser | null>
```

**Behavior:**
- Validates session cookie
- Returns user data + settings + budget
- Cache tag: `session`

**Response:**
```json
{
  "success": true,
  "user": {
    "customerId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "currency": "SEK",
    "totalBudgetLimit": 10000
  }
}
```

---

#### DELETE `/api/session`

**Backend:** `packages/backend/src/routes/session.ts:42`

**Frontend Function:**
```typescript
logout() // Same as POST /api/auth/logout
```

---

### 3. Accounts Routes (`/api/accounts`)

#### GET `/api/accounts`

**Backend:** `packages/backend/src/routes/accounts.ts:7`

**Frontend Function:**
```typescript
getAccounts(): Promise<Account[]>
```

**Behavior:**
- Returns all accounts for current user
- Cache tag: `accounts`
- Revalidates after Tink callback

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "accountId": "id",
      "customerId": "uuid",
      "name": "Checking Account",
      "balance": 1500.50,
      "type": "CHECKING",
      // ...other fields
    }
  ]
}
```

---

### 4. Transactions Routes (`/api/transactions`)

#### GET `/api/transactions`

**Backend:** `packages/backend/src/routes/transactions.ts:7`

**Frontend Function:**
```typescript
getTransactions(): Promise<Transaction[]>
```

**Behavior:**
- Returns all transactions for current user
- Sorted by `bookedDate` descending
- Cache tag: `transactions`
- Revalidates after CRUD ops or Tink callback

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "transactionId": "id",
      "customerId": "uuid",
      "accountId": "account-id",
      "description": "Coffee Shop",
      "amount": -4.50,
      "bookedDate": "2024-01-01",
      "category": "Food & Dining",
      // ...other fields
    }
  ]
}
```

---

### 5. Budget Routes (`/api/budget`)

#### GET `/api/budget`

**Backend:** `packages/backend/src/routes/budget.ts:9`

**Frontend Function:**
```typescript
getBudget(): Promise<Budget | null>
```

**Behavior:**
- Returns budget for current user
- Returns empty budget if none exists
- Cache tag: `budget`

**Response:**
```json
{
  "customerId": "uuid",
  "totalBudgetLimit": 10000,
  "categories": [
    {
      "category": "Food & Dining",
      "limit": 2000
    }
  ],
  "period": {
    "type": "current-month"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### POST `/api/budget`

**Backend:** `packages/backend/src/routes/budget.ts:36`

**Frontend Function:**
```typescript
updateBudget(
  totalBudgetLimit: number,
  categories: CategoryBudget[],
  period?: BudgetPeriod
): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- **Full replacement** of budget
- Creates if doesn't exist
- Updates user's `totalBudgetLimit`
- Revalidates: `budget`, `session`

---

#### PATCH `/api/budget`

**Backend:** `packages/backend/src/routes/budget.ts:99`

**Frontend Function:**
```typescript
patchBudget(updates: {
  totalBudgetLimit?: number
  categories?: CategoryBudget[]
  period?: BudgetPeriod
}): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- **Partial update** of budget
- Only updates provided fields
- Merges with existing budget
- Revalidates: `budget`, `session`

---

### 6. Settings Routes (`/api/settings`)

#### GET `/api/settings`

**Backend:** `packages/backend/src/routes/settings.ts:31`

**Frontend Function:**
```typescript
getSettings(): Promise<Settings | null>
```

**Behavior:**
- Returns settings for current user
- Cache tag: `settings`

**Response:**
```json
{
  "success": true,
  "settings": {
    "customerId": "uuid",
    "currency": "SEK",
    "theme": "light",
    "notifications": true,
    // ...other settings
  }
}
```

---

#### POST `/api/settings`

**Backend:** `packages/backend/src/routes/settings.ts:51`

**Frontend Function:**
```typescript
updateSettings(settings: Partial<Settings>): Promise<{
  success: boolean
  message?: string
  settings?: Settings
}>
```

**Behavior:**
- Updates settings (upsert)
- Revalidates: `settings`, `session`

---

#### DELETE `/api/settings/account`

**Backend:** `packages/backend/src/routes/settings.ts:78`

**Frontend Function:**
```typescript
deleteAccount(): Promise<{ success: boolean; message?: string }>
```

**Behavior:**
- **Destructive operation**
- Deletes user and ALL associated data:
  - Users collection
  - Accounts collection
  - Transactions collection
  - Budgets collection
  - Spending categories collection
  - Settings collection
  - Sessions collection (via cascade)
- Revalidates: All tags

---

### 7. Categories Routes (`/api/categories`)

#### GET `/api/categories`

**Backend:** `packages/backend/src/routes/categories.ts:12`

**Frontend Function:**
```typescript
getCustomCategories(): Promise<CustomCategory[]>
```

**Behavior:**
- Returns custom categories for current user
- Cache tag: `categories`

---

#### POST `/api/categories`

**Backend:** `packages/backend/src/routes/categories.ts:29`

**Frontend Function:**
```typescript
createCustomCategory(categoryData: {
  name: string
  keywords: string[]
  color?: string
}): Promise<CustomCategory | null>
```

**Behavior:**
- Creates new custom category
- Revalidates: `categories`

---

#### PATCH `/api/categories/:id`

**Backend:** `packages/backend/src/routes/categories.ts:60`

**Frontend Function:**
```typescript
updateCustomCategory(
  categoryId: string,
  updates: { name?: string; keywords?: string[]; color?: string }
): Promise<{ success: boolean }>
```

**Behavior:**
- Updates existing category
- Partial update (only provided fields)
- Revalidates: `categories`

---

#### DELETE `/api/categories/:id`

**Backend:** `packages/backend/src/routes/categories.ts:95`

**Frontend Function:**
```typescript
deleteCustomCategory(categoryId: string): Promise<{ success: boolean }>
```

**Behavior:**
- Deletes custom category
- Revalidates: `categories`

---

### 8. Tink Callback (`/api/callback`)

#### GET `/api/callback?code=...`

**Backend:** `packages/backend/src/routes/callback.ts:11`

**Frontend Function:**
```typescript
processTinkCallback(code: string): Promise<{
  success: boolean
  message?: string
  accountsCount?: number
  transactionsCount?: number
}>
```

**Behavior:**
- Exchanges OAuth code for access token
- Fetches accounts and transactions from Tink
- Bulk inserts into MongoDB
- Revalidates: `accounts`, `transactions`

**Response:**
```json
{
  "success": true,
  "message": "Bank data imported successfully",
  "accountsCount": 3,
  "transactionsCount": 156
}
```

---

## Authentication Middleware

All protected routes use `authMiddleware` which:

1. Reads `session-id` cookie
2. Looks up session in MongoDB
3. Validates session hasn't expired
4. Updates `lastAccessedAt` timestamp
5. Attaches user data to `req.user`

**Frontend Impact:**
- `serverFetch()` automatically forwards session cookie
- No need for manual auth headers

---

## Cache Invalidation Patterns

### After Login
```typescript
revalidateTag('session')
```

### After Logout/Logout All
```typescript
revalidateTag('session')
revalidateTag('sessions-list')
```

### After Budget Update
```typescript
revalidateTag('budget')
revalidateTag('session') // totalBudgetLimit in session
```

### After Tink Import
```typescript
revalidateTag('accounts')
revalidateTag('transactions')
```

### After Profile Update
```typescript
revalidateTag('session')
if (updates.totalBudgetLimit) {
  revalidateTag('budget')
}
```

### After Account Deletion
```typescript
revalidateTag('session')
revalidateTag('accounts')
revalidateTag('transactions')
revalidateTag('budget')
revalidateTag('settings')
revalidateTag('categories')
revalidateTag('sessions-list')
```

---

## Missing Backend Routes

These operations are **NOT YET IMPLEMENTED** in the backend:

### Transaction CRUD

- ❌ `POST /api/transactions` - Create transaction
- ❌ `PATCH /api/transactions/:id` - Update transaction
- ❌ `DELETE /api/transactions/:id` - Delete transaction

**Note:** Transactions are currently read-only (imported from Tink only)

### Account Management

- ❌ `PATCH /api/accounts/:id` - Update account
- ❌ `DELETE /api/accounts/:id` - Delete account

**Note:** Accounts are currently managed by Tink only

---

## Frontend-Only Functions (api-service-client.ts)

These functions exist in `api-service-client.ts` for client-side usage but correspond to the same backend routes:

- `logoutClient()` → `POST /api/auth/logout`
- `updateBudgetClient()` → `POST /api/budget`
- `updateSettingsClient()` → `POST /api/settings`
- `getSessionClient()` → `GET /api/session`
- `getAccountsClient()` → `GET /api/accounts`
- `getTransactionsClient()` → `GET /api/transactions`

**Difference:** Client functions don't use Next.js caching and require manual `router.refresh()`.

---

## Usage Patterns

### Server Component (Recommended)

```typescript
import { getSession, getAccounts } from '@/lib/api-service'

export default async function Page() {
  const [session, accounts] = await Promise.all([
    getSession(),
    getAccounts()
  ])
  
  // Automatically cached by Next.js
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
    await updateBudget(5000, [])
    router.refresh() // Trigger cache revalidation
  }
  
  return <form action={handleSubmit}>...</form>
}
```

---

## Type Safety

All functions use shared types from `@money-mapper/shared`:

```typescript
import type {
  Account,
  Transaction,
  Budget,
  Settings,
  CustomCategory,
  SessionUser,
  CategoryBudget,
  BudgetPeriod,
} from '@money-mapper/shared'
```

This ensures type consistency between frontend and backend.

---

## Related Documentation

- [API Service Reference](./API_SERVICE_REFERENCE.md) - Detailed function documentation
- [API Service Client Reference](./API_SERVICE_CLIENT_REFERENCE.md) - Client-side functions
- [Backend Authentication Flow](../../backend/docs/COMPLETE_AUTH_SESSION_FLOW.md) - Session management details
