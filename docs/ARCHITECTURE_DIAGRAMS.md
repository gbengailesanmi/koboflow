# Money Mapper Architecture Diagrams

Visual diagrams showing the complete architecture after Phase 1 migration.

---

## 1. Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 15)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │  Server Components   │        │  Client Components   │          │
│  │  (RSC - Recommended) │        │  (Interactive UI)     │          │
│  └──────────┬───────────┘        └──────────┬───────────┘          │
│             │                               │                        │
│             ▼                               ▼                        │
│  ┌─────────────────────┐        ┌──────────────────────┐          │
│  │  api-service.ts     │        │  ui-store.ts         │          │
│  │  (Server Actions)   │        │  (Zustand - UI only) │          │
│  │  • getSession()     │        │  • Selected items     │          │
│  │  • getAccounts()    │        │  • Modals            │          │
│  │  • updateBudget()   │        │  • Filters           │          │
│  │  • 20 more...       │        │  • Toasts            │          │
│  └─────────┬───────────┘        └──────────┬───────────┘          │
│            │                               │                        │
│            │                    ┌──────────▼──────────┐            │
│            │                    │ api-service-client  │            │
│            │                    │ (Client mutations)  │            │
│            │                    └──────────┬──────────┘            │
│            │                               │                        │
│            ▼                               ▼                        │
│  ┌─────────────────────────────────────────────────┐              │
│  │         Next.js 15 Automatic Caching             │              │
│  │  • Tags: session, accounts, transactions, etc.   │              │
│  │  • Automatic revalidation                        │              │
│  │  • No manual cache management needed             │              │
│  └─────────────────────┬───────────────────────────┘              │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         │
                         │ HTTP + session-id cookie
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│                       BACKEND (Express.js)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     authMiddleware                            │  │
│  │  1. Read session-id cookie                                    │  │
│  │  2. Lookup session in MongoDB                                 │  │
│  │  3. Validate expiry (< 7 days)                               │  │
│  │  4. Update lastAccessedAt                                     │  │
│  │  5. Attach user to req.user                                   │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼────────────────────────┐               │
│  │              API Routes                          │               │
│  │  • /api/auth/* - Authentication                  │               │
│  │  • /api/session - Session management             │               │
│  │  • /api/accounts - Account data                  │               │
│  │  • /api/transactions - Transaction data          │               │
│  │  • /api/budget - Budget management               │               │
│  │  • /api/settings - User settings                 │               │
│  │  • /api/categories - Custom categories           │               │
│  │  • /api/callback - Tink OAuth                    │               │
│  └────────────────────────┬────────────────────────┘               │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     MongoDB Collections                       │  │
│  │  • users - User accounts                                      │  │
│  │  • sessions - Active sessions (TTL index)                     │  │
│  │  • accounts - Bank accounts                                   │  │
│  │  • transactions - Financial transactions                      │  │
│  │  • budgets - Budget data                                      │  │
│  │  • settings - User preferences                                │  │
│  │  • spending_categories - Custom categories                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Session Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { email, password }
       │
       ▼
┌──────────────────────────┐
│   Backend: auth.ts       │
├──────────────────────────┤
│ 1. Validate credentials  │
│ 2. Call createSession()  │
│    ↓                     │
│    └─→ MongoDB           │
│       INSERT INTO        │
│       sessions {         │
│         sessionId: uuid  │
│         customerId       │
│         expiresAt: +7d   │
│         userAgent        │
│         ipAddress        │
│       }                  │
│                          │
│ 3. Set cookie:           │
│    session-id=uuid       │
│    HttpOnly, 7d expiry   │
│                          │
│ 4. Return user data      │
└────────┬─────────────────┘
         │
         │ Response:
         │ Set-Cookie: session-id=abc123...
         │ { success: true, user: {...} }
         │
         ▼
┌─────────────────────────┐
│   Browser (Cookies)     │
│  session-id: abc123...  │
└─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Subsequent Requests                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ GET /api/accounts
       │ Cookie: session-id=abc123
       │
       ▼
┌──────────────────────────┐
│  authMiddleware          │
├──────────────────────────┤
│ 1. Extract session-id    │
│    from cookie           │
│                          │
│ 2. Query MongoDB:        │
│    sessions.findOne({    │
│      sessionId: "abc123" │
│    })                    │
│                          │
│ 3. Check expiry:         │
│    if (expiresAt < now)  │
│      → 401 Unauthorized  │
│                          │
│ 4. Update timestamp:     │
│    lastAccessedAt = now  │
│                          │
│ 5. Attach to request:    │
│    req.user = {          │
│      customerId,         │
│      email, ...          │
│    }                     │
│    req.sessionId = id    │
└────────┬─────────────────┘
         │
         │ Request authorized
         │
         ▼
┌──────────────────────────┐
│  Route Handler           │
│  /api/accounts           │
├──────────────────────────┤
│ Access req.user.customerId│
│ Query accounts           │
│ Return data              │
└──────────────────────────┘
```

---

## 3. Data Fetching Flow (Server Component)

```
┌──────────────────────────────────────────────────┐
│  Server Component: DashboardPage                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  const accounts = await getAccounts()            │
│                    ↓                              │
│                    │                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  api-service.ts: getAccounts()                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. serverFetch(url, {                           │
│       next: { tags: ['accounts'] }               │
│     })                                            │
│                    ↓                              │
│                    │                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Next.js 15 Fetch Cache                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  Check cache for tag 'accounts'                  │
│                                                   │
│  ┌──────────┐                                    │
│  │ Cached?  │─── Yes ──→ Return cached data      │
│  └────┬─────┘                                    │
│       │                                           │
│       No                                          │
│       │                                           │
└───────┼───────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│  serverFetch() internal                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. Get session-id from cookies                  │
│  2. Add to headers: Cookie: session-id=...       │
│  3. fetch(BACKEND_URL/api/accounts)              │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Backend: /api/accounts                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. authMiddleware validates session             │
│  2. Query MongoDB accounts collection            │
│  3. Return { success: true, accounts: [...] }    │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Next.js Cache                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  Store response with tag 'accounts'              │
│  Cache until revalidateTag('accounts') called    │
│                                                   │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Server Component receives data                  │
└──────────────────────────────────────────────────┘
```

---

## 4. Mutation Flow (Client Component)

```
┌──────────────────────────────────────────────────┐
│  Client Component: UpdateBudgetForm              │
├──────────────────────────────────────────────────┤
│                                                   │
│  User clicks "Save Budget"                       │
│       ↓                                           │
│  async function handleSubmit() {                 │
│    const result = await updateBudget(...)        │
│    if (result.success) {                         │
│      router.refresh()  ← Trigger re-render       │
│    }                                              │
│  }                                                │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  api-service.ts: updateBudget()                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. serverFetch(url, {                           │
│       method: 'POST',                             │
│       body: JSON.stringify({...}),               │
│       cache: 'no-store'  ← Don't cache mutations │
│     })                                            │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Backend: POST /api/budget                       │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. authMiddleware validates session             │
│  2. Update MongoDB budgets collection            │
│  3. Update users.totalBudgetLimit                │
│  4. Return { success: true }                     │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  api-service.ts: updateBudget() continues        │
├──────────────────────────────────────────────────┤
│                                                   │
│  if (data.success) {                             │
│    revalidateTag('budget')    ← Invalidate cache │
│    revalidateTag('session')   ← Invalidate cache │
│  }                                                │
│  return data                                      │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Client Component: handleSubmit() continues      │
├──────────────────────────────────────────────────┤
│                                                   │
│  if (result.success) {                           │
│    router.refresh()  ← Tell Next.js to re-render │
│  }                                                │
│                    ↓                              │
└────────────────────┼──────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Next.js Router                                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. Re-render Server Components                  │
│  2. Call getBudget() again                       │
│  3. Cache was invalidated, fetch fresh data      │
│  4. Update UI with new data                      │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 5. Session Lifecycle

```
┌────────────────────────────────────────────────────────┐
│                   Session Lifecycle                     │
└────────────────────────────────────────────────────────┘

1. USER LOGS IN
   ↓
   POST /api/auth/login
   ↓
   createSession(customerId, email, firstName, lastName, userAgent, ip)
   ↓
   MongoDB: INSERT INTO sessions {
     sessionId: "uuid-1234",
     customerId: "user-uuid",
     email: "user@example.com",
     firstName: "John",
     lastName: "Doe",
     createdAt: NOW,
     lastAccessedAt: NOW,
     expiresAt: NOW + 7 days,
     userAgent: "Mozilla/5.0...",
     ipAddress: "127.0.0.1"
   }
   ↓
   Set-Cookie: session-id=uuid-1234; HttpOnly; MaxAge=604800
   ↓
   SESSION ACTIVE ✓

2. USER MAKES REQUESTS
   ↓
   Every request with session-id cookie
   ↓
   authMiddleware checks session
   ↓
   MongoDB: UPDATE sessions
   SET lastAccessedAt = NOW
   WHERE sessionId = "uuid-1234"
   ↓
   SESSION RENEWED ✓

3. SESSION EXPIRY (After 7 days of inactivity)
   ↓
   User makes request
   ↓
   authMiddleware checks session
   ↓
   if (session.expiresAt < NOW) {
     return 401 Unauthorized
   }
   ↓
   SESSION EXPIRED ✗

4. AUTOMATIC CLEANUP
   ↓
   MongoDB TTL Index (every 60 seconds)
   ↓
   DELETE FROM sessions
   WHERE expiresAt < NOW
   ↓
   Cron Job (every hour)
   ↓
   cleanupExpiredSessions()
   ↓
   EXPIRED SESSIONS REMOVED ✓

5. USER LOGS OUT
   ↓
   POST /api/auth/logout
   ↓
   deleteSession(sessionId)
   ↓
   MongoDB: DELETE FROM sessions
   WHERE sessionId = "uuid-1234"
   ↓
   Clear-Cookie: session-id
   ↓
   SESSION DELETED ✓

6. USER LOGS OUT FROM ALL DEVICES
   ↓
   POST /api/auth/logout-all
   ↓
   deleteAllUserSessions(customerId)
   ↓
   MongoDB: DELETE FROM sessions
   WHERE customerId = "user-uuid"
   ↓
   Clear-Cookie: session-id
   ↓
   ALL SESSIONS DELETED ✓
```

---

## 6. Cache Invalidation Flow

```
┌────────────────────────────────────────────────────────┐
│              Cache Invalidation Diagram                 │
└────────────────────────────────────────────────────────┘

Initial State: Cached Data
┌─────────────────────────────────────┐
│  Next.js Cache                      │
├─────────────────────────────────────┤
│  Tag: 'budget'                      │
│  Data: { totalBudgetLimit: 5000 }  │
└─────────────────────────────────────┘

User Updates Budget
       ↓
updateBudget(10000, categories)
       ↓
POST /api/budget { totalBudgetLimit: 10000 }
       ↓
Backend updates MongoDB
       ↓
Returns { success: true }
       ↓
revalidateTag('budget')  ← Invalidate cache
       ↓
┌─────────────────────────────────────┐
│  Next.js Cache                      │
├─────────────────────────────────────┤
│  Tag: 'budget' → INVALIDATED ✗     │
└─────────────────────────────────────┘
       ↓
router.refresh()
       ↓
Server Component re-renders
       ↓
getBudget() called
       ↓
Cache miss (was invalidated)
       ↓
Fetch fresh data from backend
       ↓
┌─────────────────────────────────────┐
│  Next.js Cache                      │
├─────────────────────────────────────┤
│  Tag: 'budget'                      │
│  Data: { totalBudgetLimit: 10000 } │← New cached data
└─────────────────────────────────────┘
       ↓
UI updates with new data ✓
```

---

## 7. Component Hierarchy

```
┌───────────────────────────────────────────────────────────┐
│                    App Layout (RSC)                        │
│  • Fetches session with getSession()                      │
│  • Wraps app with providers                               │
└───────────────────┬───────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  Dashboard Page  │   │  Budget Page     │
│  (Server Comp)   │   │  (Server Comp)   │
├──────────────────┤   ├──────────────────┤
│ • getAccounts()  │   │ • getBudget()    │
│ • getTransactions()│  │ • getCategories()│
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  AccountsList    │   │  BudgetForm      │
│  (Client Comp)   │   │  (Client Comp)   │
├──────────────────┤   ├──────────────────┤
│ • Receives data  │   │ • updateBudget() │
│   as props       │   │ • router.refresh()│
│ • Uses ui-store  │   │ • Uses ui-store  │
│   for UI state   │   │   for UI state   │
└──────────────────┘   └──────────────────┘

Legend:
RSC = React Server Component (server-side, cached)
Client Comp = Client Component (interactive, uses Server Actions)
```

---

## 8. State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
└─────────────────────────────────────────────────────────┘

SERVER STATE (Next.js Cache)
┌─────────────────────────────────────────┐
│  Managed by: Next.js 15 Automatic Cache │
│  Source: api-service.ts functions       │
├─────────────────────────────────────────┤
│  • Session data                         │
│  • Accounts                             │
│  • Transactions                         │
│  • Budget                               │
│  • Settings                             │
│  • Categories                           │
└─────────────────────────────────────────┘
        ↑
        │ Automatically cached and revalidated
        │ No manual management needed ✓
        ↓
┌─────────────────────────────────────────┐
│  Server Components (RSC)                │
│  • Fetch data on server                 │
│  • Pass to Client Components as props   │
└─────────────────────────────────────────┘

UI STATE (Zustand Store)
┌─────────────────────────────────────────┐
│  Managed by: ui-store.ts (Zustand)      │
│  Used by: Client Components             │
├─────────────────────────────────────────┤
│  • Selected items (IDs)                 │
│  • Modal state (open/close, type, data) │
│  • Filters (date range, categories)     │
│  • View preferences (sort, view mode)   │
│  • Toasts (notifications)               │
│  • Sidebar state (open/close)           │
└─────────────────────────────────────────┘
        ↑
        │ Client-side only
        │ Ephemeral UI state
        ↓
┌─────────────────────────────────────────┐
│  Client Components                      │
│  • Interactive UI elements              │
│  • Forms, modals, filters               │
└─────────────────────────────────────────┘

DELETED (No longer needed)
┌─────────────────────────────────────────┐
│  ✗ api-client.ts (redundant)            │
│  ✗ api-cache.ts (Next.js handles this)  │
│  ✗ Zustand data slices (accounts, etc.) │
└─────────────────────────────────────────┘
```

---

## 9. File Structure

```
packages/web/src/
│
├── config.ts                     # Centralized env config
│
├── lib/
│   ├── api-service.ts           # ⭐ Server Actions (685 lines)
│   ├── api-service-client.ts    # Client-side mutations
│   ├── default-settings.ts      # Settings types
│   ├── session.ts               # Session helpers
│   └── settings-helpers.ts      # Settings utils
│
├── store/
│   └── ui-store.ts              # ⭐ UI-only Zustand store
│
├── app/
│   ├── [customerId]/
│   │   ├── dashboard/           # Server Component pages
│   │   │   └── page.tsx         # Fetches with getAccounts(), etc.
│   │   ├── budget/
│   │   │   └── page.tsx
│   │   └── transactions/
│   │       └── page.tsx
│   │
│   ├── forms/
│   │   ├── login-form.tsx       # Client Component (uses login())
│   │   └── signup-form.tsx      # Client Component (uses signup())
│   │
│   └── components/              # Client Components
│       └── ...                  # Use ui-store for UI state
│
└── docs/
    ├── API_SERVICE_REFERENCE.md        # 500+ lines
    ├── BACKEND_ROUTES_MAPPING.md       # 600+ lines
    ├── API_SERVICE_QUICK_REFERENCE.md  # This file
    └── ARCHITECTURE_MIGRATION.md       # Overview
```

---

## 10. Before vs After Comparison

```
BEFORE (JWT + Manual Caching)
┌─────────────────────────────────┐
│  Client Component               │
│         ↓                        │
│  useEffect() fetch data          │
│         ↓                        │
│  Zustand Store (data + UI)      │
│         ↓                        │
│  api-client.ts                  │
│         ↓                        │
│  api-cache.ts (manual cache)    │
│         ↓                        │
│  Backend API                    │
└─────────────────────────────────┘

Problems:
✗ Client-side rendering (slow)
✗ Manual cache management
✗ Data duplication
✗ Complex state management
✗ Poor SEO

AFTER (Sessions + Next.js Caching)
┌─────────────────────────────────┐
│  Server Component (RSC)         │
│         ↓                        │
│  api-service.ts (Server Action) │
│         ↓                        │
│  Next.js Auto Cache             │
│         ↓                        │
│  Backend API                    │
│                                  │
│  Client Component (UI only)     │
│         ↓                        │
│  ui-store.ts (UI state only)    │
└─────────────────────────────────┘

Benefits:
✓ Server-side rendering (fast)
✓ Automatic caching
✓ Single source of truth
✓ Simple state management
✓ Excellent SEO
```

---

**These diagrams provide a visual reference for understanding the complete Money Mapper architecture after Phase 1 migration.**
