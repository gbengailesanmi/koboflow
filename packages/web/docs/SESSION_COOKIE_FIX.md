# Session Cookie Not Set on Login - CRITICAL BUG FIX

## Issue

After successful login (`POST /login 200`), users were getting **401 Unauthorized** errors on the dashboard when trying to fetch accounts and transactions:

```
POST /login 200 in 177ms
getAccounts error: Error: Request failed: 401
getTransactions error: Error: Request failed: 401
GET /c356e643-19e5-4669-a199-01511a339f88/dashboard 200 in 39ms
```

## Root Cause

**Server-Side Login Cannot Set Browser Cookies**

The login and signup forms were using **server-side** functions from `api-service.ts`:

```typescript
// ❌ WRONG: Server-side fetch (Server Action)
import { login, signup } from '@/lib/api-service'

const result = await login(email, password)
```

When Server Actions call the backend API, it's a **server-to-server** request:

```
Next.js Server → Express Backend → Returns session-id cookie
                ↓
        Cookie stays on Next.js server
                ↓
        User's browser NEVER receives the cookie
                ↓
        Subsequent requests fail with 401
```

### Why This Happens

1. **Server Actions run on the Next.js server**, not in the browser
2. Backend sets `Set-Cookie: session-id=...` in the response
3. Next.js server receives the cookie but **doesn't forward it to the browser**
4. User's browser has no session cookie
5. When dashboard loads, `getAccounts()` and `getTransactions()` fail with 401

## The Fix

**Use Client-Side Functions for Authentication**

Authentication (login/signup) MUST happen **client-side** so the browser can receive and store the session cookie.

### Created Client-Side Auth Functions

Added to `/lib/api-service-client.ts`:

```typescript
/**
 * Login user (client-side)
 * MUST be client-side so browser receives session-id cookie
 */
export async function loginClient(email: string, password: string) {
  return fetchClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Signup user (client-side)
 * MUST be client-side so browser can receive verification instructions
 */
export async function signupClient(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}) {
  return fetchClient('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}
```

### Updated Login Form

```typescript
// Before (WRONG)
import { login } from '@/lib/api-service'
const result = await login(email, password)

// After (CORRECT)
import { loginClient } from '@/lib/api-service-client'
const result = await loginClient(email, password)
```

### Updated Signup Form

```typescript
// Before (WRONG)
import { signup } from '@/lib/api-service'
const result = await signup({ ... })

// After (CORRECT)
import { signupClient } from '@/lib/api-service-client'
const result = await signupClient({ ... })
```

## How It Works Now

```
User submits login form
    ↓ Client-side fetch
Browser → Express Backend
    ↓ Backend creates session
Backend responds with Set-Cookie: session-id=...
    ↓ Browser receives cookie
Browser stores session-id cookie
    ↓ Cookie automatically sent with requests
Dashboard fetches data successfully ✅
```

## Files Modified

- ✅ `/lib/api-service-client.ts` - Added `loginClient()` and `signupClient()`
- ✅ `/app/forms/login-form.tsx` - Changed to use `loginClient()`
- ✅ `/app/forms/signup-form.tsx` - Changed to use `signupClient()`

## When to Use Client vs Server

### ✅ Use Client-Side (`api-service-client.ts`)

- **Authentication** (login, signup, logout)
  - Browser needs to receive/send session cookies
- **Mutations with immediate feedback** (create, update, delete)
  - User initiated actions that need instant response
- **Real-time data** (when cache isn't suitable)
  - Chat messages, notifications, live updates

### ✅ Use Server-Side (`api-service.ts`)

- **Data fetching for Server Components**
  - Dashboard, pages that need initial data
- **Session validation**
  - `getSession()` on server to protect routes
- **Bulk data operations**
  - Large datasets, reports, exports

## The Pattern

```typescript
// Client Components that need auth
'use client'
import { loginClient, signupClient, logoutClient } from '@/lib/api-service-client'

// Server Components that need data
import { getSession, getAccounts, getTransactions } from '@/lib/api-service'
```

## Testing

✅ **Test login flow:**
1. Login with valid credentials
2. Check browser DevTools → Application → Cookies
3. Verify `session-id` cookie is set
4. Dashboard should load with data

✅ **Test signup flow:**
1. Signup new account
2. Verify email
3. Login
4. Verify session cookie is set
5. Dashboard should work

## Why This Bug Occurred

The Server Component migration converted many client-side calls to server-side, which is **correct for data fetching**. However, authentication was mistakenly converted too, breaking the cookie flow.

### The Lesson

**Authentication operations are special** - they require client-side execution to establish browser sessions, even in a Server Component architecture.

## Status

**FIXED** ✅ - Login and signup now properly set session cookies in the browser.
