# Edge Runtime Fix - Middleware Update

## Problem
The middleware was causing an error because it was trying to use Node.js modules (MongoDB, crypto) in the Edge Runtime, which doesn't support them:

```
The edge runtime does not support Node.js 'crypto' module.
```

## Solution
Changed the middleware to use NextAuth's built-in middleware approach, which is Edge Runtime compatible.

## Changes Made

### 1. Updated `src/middleware.ts`
**Before:**
```typescript
import { auth } from '@/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  // ... custom logic
}
```

**After:**
```typescript
export { auth as middleware } from '@/auth'
```

This exports NextAuth's middleware directly, which is optimized for Edge Runtime.

### 2. Updated `src/auth.ts`
Added the `authorized` callback to handle route protection logic:

```typescript
callbacks: {
  async authorized({ auth, request }) {
    const { pathname } = request.nextUrl
    const isAuthenticated = !!auth?.user?.customerId
    
    // Route protection logic here
    // Returns true to allow, or Response.redirect() to redirect
  },
  // ... other callbacks
}
```

## How It Works Now

1. **NextAuth Middleware** runs on Edge Runtime (fast, no Node.js dependencies)
2. **Authorized Callback** handles all route protection logic:
   - Public routes are always accessible
   - Authenticated users are redirected from /login and /signup to dashboard
   - Unauthenticated users are redirected from protected routes to /login
3. **No MongoDB calls in middleware** - The auth session is handled efficiently by NextAuth

## Benefits

✅ **Edge Runtime Compatible** - No Node.js module errors
✅ **Better Performance** - Edge Runtime is faster than Node.js runtime
✅ **Cleaner Code** - Uses NextAuth's built-in patterns
✅ **Same Functionality** - All route protection works as before

## Testing

The application should now:
- Load without middleware errors
- Protect routes correctly
- Redirect authenticated/unauthenticated users appropriately
- Work with both credentials and Google OAuth login
