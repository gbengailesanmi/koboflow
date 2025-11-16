# OAuth Callback Route Migration to Session-Based Auth

## Summary

Updated `/app/api/callback/route.ts` to use the new **session-based authentication** instead of the old JWT-based approach.

## What Changed

### ❌ OLD (JWT-based + Duplicated Code)

```typescript
// Used JWT decoding
import jwt from 'jsonwebtoken'

// Used old cookie name
const authToken = cookieStore.get('auth-token')?.value

// Decoded JWT client-side
const decoded = jwt.decode(authToken) as { customerId?: string }
customerId = decoded?.customerId

// Manually validated session with fetch
const sessionResponse = await fetch(`${BACKEND_URL}/api/session`, {
  headers: { 'Cookie': `session-id=${sessionId}` }
})
const sessionData = await sessionResponse.json()
const customerId = sessionData.user?.customerId

// Manually called backend callback
const backendResponse = await fetch(
  `${backendUrl}/api/callback?code=${code}`,
  { headers: { 'Cookie': `session-id=${sessionId}` } }
)
const data = await backendResponse.json()
```

### ✅ NEW (Session-based + Uses api-service)

```typescript
// No JWT dependency needed
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, processTinkCallback } from '@/lib/api-service'

// Uses new session-id cookie
const sessionId = cookieStore.get('session-id')?.value

// ✅ Uses api-service function (no duplication!)
const session = await getSession()
const customerId = session?.customerId

// ✅ Uses api-service function (no duplication!)
const result = await processTinkCallback(code)

// All backend communication centralized in api-service.ts
```

## Why This Matters

### Security Improvements
- ✅ **No client-side JWT decoding** - Session validation happens server-side only
- ✅ **Session revocation** - Sessions can be invalidated in the database
- ✅ **Better tracking** - Session metadata (IP, user agent, last access) stored in DB

### Consistency
- ✅ **Matches backend auth** - Backend middleware expects `session-id` cookie
- ✅ **Matches all pages** - Dashboard, Transactions, Budget, etc. all use session-based auth
- ✅ **Single source of truth** - Session data lives in MongoDB, not JWT payload

### Architecture Benefits
- ✅ **Server Components ready** - Aligns with Next.js 15 Server Component pattern
- ✅ **Stateful sessions** - Can track multiple sessions per user
- ✅ **Activity monitoring** - lastAccessedAt updated on each request
- ✅ **DRY principle** - No code duplication, all backend communication via api-service
- ✅ **Easier maintenance** - Changes to session/callback logic only in one place

## The OAuth Flow (Updated)

```
1. User clicks "Import Bank Account" in dashboard
   ↓
2. Redirected to Tink OAuth page (external)
   ↓
3. User authorizes bank account on Tink
   ↓
4. Tink redirects back: yourapp.com/api/callback?code=ABC123
   ↓
5. 🆕 Web callback validates session-id cookie
   ↓
6. 🆕 Web callback calls GET /api/session to get customerId
   ↓
7. Web callback forwards to backend: POST /api/callback?code=ABC123
   ↓
8. Backend authMiddleware validates session-id
   ↓
9. Backend exchanges OAuth code with Tink API
   ↓
10. Backend fetches accounts & transactions from Tink
    ↓
11. Backend stores data in MongoDB
    ↓
12. Backend returns success JSON
    ↓
13. Web callback redirects user to dashboard with results
```

## Backend Expectations

The backend callback route expects:

```typescript
// /packages/backend/src/routes/callback.ts
callbackRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const customerId = req.user?.customerId  // ✅ From session
  // ... process OAuth callback
})

// /packages/backend/src/middleware/middleware.ts
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.['session-id']  // ✅ Expects session-id cookie
  const session = await getSession(sessionId)     // ✅ Database lookup
  
  req.user = {
    customerId: session.customerId,
    email: session.email,
    // ...
  }
}
```

## Files Updated

### Modified
- ✅ `/packages/web/src/app/api/callback/route.ts` - Updated to session-based auth

### Identified as Outdated (Not Used)
- ⚠️ `/packages/web/src/lib/session.ts` - Old JWT-based session helpers (unused)

## Testing Checklist

- [ ] Test bank account import flow
- [ ] Verify session-id cookie is present during callback
- [ ] Confirm backend receives correct session-id
- [ ] Test error handling (missing session, invalid session)
- [ ] Verify redirect URLs work correctly
- [ ] Test with expired session
- [ ] Test with multiple browser tabs

## Next Steps

Consider removing unused old auth files:
- `/packages/web/src/lib/session.ts` - Old JWT-based session helpers (has 0 usages)

## Migration Status

- ✅ Dashboard page - Session-based
- ✅ Transactions page - Session-based
- ✅ Budget page - Session-based
- ✅ Analytics page - Session-based
- ✅ Profile page - Session-based
- ✅ Settings page - Session-based
- ✅ **OAuth Callback route - Session-based** (JUST COMPLETED)
- ⚠️ Old session.ts helpers - Still exists but unused

**Migration Progress: 100% Complete** 🎉
