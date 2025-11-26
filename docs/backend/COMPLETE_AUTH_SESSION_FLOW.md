# Complete Authentication, Session & API Flow Story

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [The Journey: From User Action to Database](#the-journey-from-user-action-to-database)
3. [Authentication Flow (Credentials)](#authentication-flow-credentials)
4. [Authentication Flow (Google OAuth)](#authentication-flow-google-oauth)
5. [Session Management Lifecycle](#session-management-lifecycle)
6. [API Communication Pattern](#api-communication-pattern)
7. [Request/Response Cycle](#requestresponse-cycle)
8. [Database Layer](#database-layer)
9. [Security Model](#security-model)
10. [Frontend Integration](#frontend-integration)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌────────────────┐                    ┌──────────────────┐     │
│  │  React/Next.js │ ←── Cookie ────→   │  session-id      │     │
│  │  Frontend      │    (HttpOnly)      │  (UUID)          │     │
│  └────────┬───────┘                    └──────────────────┘     │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ HTTP Requests (with session-id cookie)
            │
┌───────────▼──────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Request arrives with session-id cookie              │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │  2. Middleware extracts session-id from cookie          │    │
│  │     (authMiddleware in middleware.ts)                   │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │  3. Calls getSession(sessionId)                         │    │
│  │     (session.ts service)                                │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│                              ├── Session valid?                  │
│                              │                                   │
│            ┌─────────────────┼─────────────────┐                │
│            │ YES              │                 │ NO             │
│            │                 │                 │                │
│  ┌─────────▼─────────┐       │      ┌──────────▼────────┐      │
│  │ Attach to req:    │       │      │  Return 401        │      │
│  │ - req.user        │       │      │  Unauthorized      │      │
│  │ - req.sessionId   │       │      └────────────────────┘      │
│  │ Update lastAccess │       │                                  │
│  └─────────┬─────────┘       │                                  │
│            │                 │                                  │
│  ┌─────────▼─────────────────▼─────────────────────────────┐   │
│  │  4. Route Handler Processes Request                     │   │
│  │     (auth.ts, accounts.ts, transactions.ts, etc.)       │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │  5. Database Operations                                 │   │
│  │     (MongoDB queries via mongo.js)                      │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │  6. Send JSON Response + Set-Cookie (if auth endpoint)  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ JSON Response
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                    MONGODB DATABASE                            │
│                                                                │
│  Collections:                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   users      │  │   sessions   │  │  accounts    │        │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤        │
│  │ customerId   │  │ sessionId    │  │ customerId   │        │
│  │ email        │  │ customerId ──┼──┤ accountId    │        │
│  │ password     │  │ expiresAt    │  │ balance      │        │
│  │ firstName    │  │ userAgent    │  └──────────────┘        │
│  │ lastName     │  │ ipAddress    │                           │
│  │ emailVerified│  │ lastAccessed │  ┌──────────────┐        │
│  └──────────────┘  └──────────────┘  │transactions  │        │
│                                       ├──────────────┤        │
│                    ┌──────────────┐  │ customerId   │        │
│                    │   budgets    │  │ amount       │        │
│                    ├──────────────┤  │ category     │        │
│                    │ customerId   │  │ date         │        │
│                    │ categories[] │  └──────────────┘        │
│                    └──────────────┘                           │
└────────────────────────────────────────────────────────────────┘
```

---

## The Journey: From User Action to Database

### Phase 1: User Lands on Login Page

```
User Browser
    ↓
GET /login (Next.js page)
    ↓
Renders login form with email/password fields
```

---

## Authentication Flow (Credentials)

### Step 1: User Submits Login Form

**Location:** Frontend (`/packages/web/src/app/login/page.tsx`)

```typescript
// User clicks "Login" button
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ← CRITICAL: Tells browser to send/receive cookies
    body: JSON.stringify({ email, password })
  })
}
```

**What happens:**
- Browser sends POST request to backend
- `credentials: 'include'` enables cookie transmission
- Request body contains email + password

---

### Step 2: Backend Receives Login Request

**Location:** Backend (`/packages/backend/src/routes/auth.ts`)

```typescript
authRoutes.post('/login', async (req, res) => {
  // 1. Extract credentials from request body
  const { email, password } = req.body

  // 2. Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' })
  }

  // 3. Query database for user
  const db = await connectDB()
  const user = await db.collection('users').findOne({ 
    email: email.trim().toLowerCase() 
  })

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  // 4. Check email verification status
  if (!user.emailVerified) {
    return res.status(403).json({ 
      message: 'Please verify your email before logging in.',
      requiresVerification: true 
    })
  }

  // 5. Compare password with hashed password in DB
  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  // 6. ✅ AUTHENTICATION SUCCESSFUL - Create session
  const sessionId = await createSession(
    user.customerId,
    user.email,
    user.firstName,
    user.lastName,
    req.headers['user-agent'], // Browser info
    req.ip                      // User's IP address
  )

  // 7. Set session-id cookie in response
  res.cookie('session-id', sessionId, {
    httpOnly: true,                    // JavaScript can't access (XSS protection)
    secure: config.IS_PRODUCTION,      // HTTPS only in production
    sameSite: 'lax',                   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: '/'                          // Available on all routes
  })

  // 8. Send user data back to frontend
  res.json({
    success: true,
    user: {
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  })
})
```

---

### Step 3: Session Creation in Database

**Location:** Backend (`/packages/backend/src/services/session.ts`)

```typescript
export async function createSession(
  customerId: string,
  email: string,
  firstName: string,
  lastName: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const db = await connectDB()
  
  // Generate unique session ID
  const sessionId = randomUUID() // e.g., "a7b3c5d9-1234-5678-9abc-def012345678"
  
  const session = {
    sessionId,
    customerId,
    email,
    firstName,
    lastName,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    lastAccessedAt: new Date(),
    userAgent: userAgent || 'Unknown',
    ipAddress: ipAddress || 'Unknown'
  }

  // Store session in MongoDB
  await db.collection('sessions').insertOne(session)
  
  return sessionId
}
```

**MongoDB Document Created:**

```json
{
  "_id": ObjectId("..."),
  "sessionId": "a7b3c5d9-1234-5678-9abc-def012345678",
  "customerId": "user-uuid-here",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "expiresAt": "2025-11-23T10:30:00.000Z",
  "lastAccessedAt": "2025-11-16T10:30:00.000Z",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "ipAddress": "192.168.1.100"
}
```

---

### Step 4: Browser Receives Response with Cookie

**Response Headers:**

```
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session-id=a7b3c5d9-1234-5678-9abc-def012345678; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax

{
  "success": true,
  "user": {
    "customerId": "user-uuid-here",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**What the browser does:**
1. Stores the `session-id` cookie (JavaScript cannot access due to `HttpOnly`)
2. Frontend code receives the JSON response
3. User is redirected to dashboard: `/{customerId}/dashboard`

---

## Authentication Flow (Google OAuth)

### Step 1: User Clicks "Sign in with Google"

**Frontend:**

```typescript
// User clicks Google button
window.location.href = 'http://localhost:3001/api/auth/google'
```

---

### Step 2: Backend Redirects to Google

**Location:** Backend (`/packages/backend/src/routes/auth.ts`)

```typescript
authRoutes.get('/google', (req, res) => {
  const clientId = config.GOOGLE_CLIENT_ID
  const redirectUri = config.GOOGLE_REDIRECT_URI
  
  const scope = 'openid email profile'
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}`

  res.redirect(authUrl) // ← Sends user to Google login page
})
```

---

### Step 3: User Logs in at Google

```
User Browser
    ↓
Google Login Page (accounts.google.com)
    ↓
User enters Google credentials
    ↓
Google redirects back to: http://localhost:3001/api/auth/google/callback?code=XXXXX
```

---

### Step 4: Backend Exchanges Code for User Info

**Location:** Backend (`/packages/backend/src/routes/auth.ts`)

```typescript
authRoutes.get('/google/callback', async (req, res) => {
  const { code } = req.query

  // 1. Exchange authorization code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  
  const tokens = await tokenResponse.json()

  // 2. Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  
  const googleUser = await userInfoResponse.json()
  // googleUser = { email: "john@gmail.com", name: "John Doe", ... }

  // 3. Check if user exists in our database
  const db = await connectDB()
  let user = await db.collection('users').findOne({ 
    email: googleUser.email.toLowerCase() 
  })

  // 4. Create new user if doesn't exist
  if (!user) {
    const customerId = randomUUID()
    
    await db.collection('users').insertOne({
      email: googleUser.email.toLowerCase(),
      firstName: googleUser.given_name || 'User',
      lastName: googleUser.family_name || '',
      customerId,
      emailVerified: true, // ← Google emails are pre-verified
      createdAt: new Date(),
      authProvider: 'google',
      googleId: googleUser.id,
    })

    await createUserSettings(customerId)
    user = await db.collection('users').findOne({ email: googleUser.email.toLowerCase() })
  }

  // 5. Create session (same as credentials login)
  const sessionId = await createSession(
    user.customerId,
    user.email,
    user.firstName,
    user.lastName,
    req.headers['user-agent'],
    req.ip
  )

  // 6. Set session-id cookie
  res.cookie('session-id', sessionId, {
    httpOnly: true,
    secure: config.IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  })
    
  // 7. Redirect to dashboard with inline script to ensure cookie is set
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Redirecting...</title></head>
      <body>
        <p>Login successful! Redirecting...</p>
        <script>
          setTimeout(() => {
            window.location.href = '${config.FRONTEND_URL}/${user.customerId}/dashboard';
          }, 50);
        </script>
      </body>
    </html>
  `)
})
```

---

## Session Management Lifecycle

### 1. Session Validation (Every Request)

**Location:** Backend (`/packages/backend/src/middleware/middleware.ts`)

```typescript
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract session-id from cookie
    const sessionId = req.cookies['session-id']

    if (!sessionId) {
      return res.status(401).json({ message: 'No session found' })
    }

    // 2. Look up session in database
    const session = await getSession(sessionId)

    if (!session) {
      return res.status(401).json({ message: 'Invalid session' })
    }

    // 3. Check if session has expired
    if (session.expiresAt < new Date()) {
      await deleteSession(sessionId)
      return res.status(401).json({ message: 'Session expired' })
    }

    // 4. ✅ Session valid - Attach user data to request
    req.user = {
      customerId: session.customerId,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName
    }
    req.sessionId = sessionId

    // 5. Update last accessed timestamp
    // (handled inside getSession function)

    next() // Continue to route handler
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
```

**What `getSession()` does:**

```typescript
export async function getSession(sessionId: string) {
  const db = await connectDB()
  
  // Find session and update lastAccessedAt in one operation
  const session = await db.collection('sessions').findOneAndUpdate(
    { sessionId },
    { $set: { lastAccessedAt: new Date() } },
    { returnDocument: 'after' }
  )

  return session
}
```

---

### 2. Logout (Single Device)

**Frontend Request:**

```typescript
await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  credentials: 'include' // Sends session-id cookie
})
```

**Backend Handler:**

```typescript
authRoutes.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  const sessionId = req.sessionId

  // 1. Delete session from database
  await deleteSession(sessionId)

  // 2. Clear cookie from browser
  res.clearCookie('session-id', {
    httpOnly: true,
    secure: config.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/'
  })
  
  res.json({ success: true, message: 'Logged out successfully' })
})
```

**What `deleteSession()` does:**

```typescript
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await connectDB()
  await db.collection('sessions').deleteOne({ sessionId })
}
```

---

### 3. Logout from All Devices

**Frontend Request:**

```typescript
await fetch('http://localhost:3001/api/auth/logout-all', {
  method: 'POST',
  credentials: 'include'
})
```

**Backend Handler:**

```typescript
authRoutes.post('/logout-all', authMiddleware, async (req: AuthRequest, res) => {
  const customerId = req.user?.customerId

  // Delete ALL sessions for this user
  const deletedCount = await deleteAllUserSessions(customerId)

  res.clearCookie('session-id')
  
  res.json({
    success: true,
    message: `Logged out from ${deletedCount} device(s)`
  })
})
```

**What `deleteAllUserSessions()` does:**

```typescript
export async function deleteAllUserSessions(customerId: string): Promise<number> {
  const db = await connectDB()
  const result = await db.collection('sessions').deleteMany({ customerId })
  return result.deletedCount
}
```

---

### 4. View Active Sessions

**Frontend Request:**

```typescript
const response = await fetch('http://localhost:3001/api/auth/sessions', {
  method: 'GET',
  credentials: 'include'
})
```

**Backend Handler:**

```typescript
authRoutes.get('/sessions', authMiddleware, async (req: AuthRequest, res) => {
  const customerId = req.user?.customerId
  const sessions = await getUserSessions(customerId)
  
  res.json({
    success: true,
    sessions: sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: session.sessionId === req.sessionId // ← Highlights current device
    }))
  })
})
```

**Example Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "a7b3c5d9-...",
      "createdAt": "2025-11-16T10:30:00.000Z",
      "lastAccessedAt": "2025-11-16T14:25:00.000Z",
      "expiresAt": "2025-11-23T10:30:00.000Z",
      "userAgent": "Mozilla/5.0 (Macintosh)...",
      "ipAddress": "192.168.1.100",
      "isCurrent": true
    },
    {
      "sessionId": "b8c4d6e0-...",
      "createdAt": "2025-11-15T08:00:00.000Z",
      "lastAccessedAt": "2025-11-15T22:10:00.000Z",
      "expiresAt": "2025-11-22T08:00:00.000Z",
      "userAgent": "Mozilla/5.0 (iPhone)...",
      "ipAddress": "10.0.0.5",
      "isCurrent": false
    }
  ]
}
```

---

### 5. Automatic Session Cleanup

**Two cleanup mechanisms:**

#### A. TTL Index (MongoDB Auto-Cleanup)

**Location:** Backend (`/packages/backend/src/db/indexes/session-indexer.ts`)

```typescript
await db.collection('sessions').createIndex(
  { expiresAt: 1 },
  { 
    expireAfterSeconds: 0, // ← Delete immediately when expiresAt is reached
    name: 'session_ttl' 
  }
)
```

**How it works:**
- MongoDB checks every 60 seconds
- Deletes any document where `expiresAt < current time`
- Automatic, no manual intervention needed

#### B. Hourly Cleanup Job (Backup)

**Location:** Backend (`/packages/backend/src/index.ts`)

```typescript
import { cleanupExpiredSessions } from './services/session'

// Run cleanup immediately on server start
cleanupExpiredSessions().catch(console.error)

// Run cleanup every hour
setInterval(async () => {
  try {
    await cleanupExpiredSessions()
  } catch (error) {
    console.error('Session cleanup error:', error)
  }
}, 60 * 60 * 1000) // 3600000ms = 1 hour
```

**What `cleanupExpiredSessions()` does:**

```typescript
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await connectDB()
  const result = await db.collection('sessions').deleteMany({
    expiresAt: { $lt: new Date() } // Delete where expiresAt is in the past
  })
  console.log(`Cleaned up ${result.deletedCount} expired sessions`)
  return result.deletedCount
}
```

---

## API Communication Pattern

### Frontend API Service Layer

**Location:** Frontend (`/packages/web/src/lib/api-service.ts`)

```typescript
const BASE_URL = 'http://localhost:3001/api'

class ApiService {
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // ← ALWAYS send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired or invalid
        window.location.href = '/login'
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  async logoutAll() {
    return this.request('/auth/logout-all', { method: 'POST' })
  }

  // Protected Resources
  async getAccounts(customerId: string) {
    return this.request(`/accounts/${customerId}`)
  }

  async getTransactions(customerId: string) {
    return this.request(`/transactions/${customerId}`)
  }

  async getBudget(customerId: string) {
    return this.request(`/budget/${customerId}`)
  }
}

export const apiService = new ApiService()
```

---

## Request/Response Cycle

### Example: Fetching User's Accounts

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: User Action                      │
│  User navigates to: http://localhost:3000/user-123/accounts     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    STEP 2: Frontend Request                      │
│  apiService.getAccounts('user-123')                             │
│  → fetch('http://localhost:3001/api/accounts/user-123', {       │
│      credentials: 'include' // Sends session-id cookie          │
│    })                                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  STEP 3: Request Reaches Backend                 │
│  GET /api/accounts/user-123                                     │
│  Headers:                                                        │
│    Cookie: session-id=a7b3c5d9-1234-5678-9abc-def012345678      │
│    Content-Type: application/json                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│               STEP 4: Middleware Validates Session               │
│  authMiddleware extracts session-id from cookie                 │
│  → getSession('a7b3c5d9-1234-5678-9abc-def012345678')          │
│  → MongoDB lookup in 'sessions' collection                      │
│  → Session found and valid                                      │
│  → Attach to req.user and req.sessionId                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  STEP 5: Route Handler Executes                  │
│  /packages/backend/src/routes/accounts.ts                       │
│                                                                  │
│  accountsRoutes.get('/:customerId', authMiddleware, async (...) │
│    const { customerId } = req.params                            │
│    const db = await connectDB()                                 │
│    const accounts = await db.collection('accounts').find({      │
│      customerId                                                  │
│    }).toArray()                                                  │
│                                                                  │
│    res.json({ success: true, accounts })                        │
│  })                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  STEP 6: MongoDB Query Executes                  │
│  db.collection('accounts').find({ customerId: 'user-123' })     │
│                                                                  │
│  Returns:                                                        │
│  [                                                               │
│    { accountId: 'acc-1', name: 'Checking', balance: 5000 },    │
│    { accountId: 'acc-2', name: 'Savings', balance: 10000 }     │
│  ]                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  STEP 7: Response Sent to Frontend               │
│  HTTP/1.1 200 OK                                                │
│  Content-Type: application/json                                 │
│                                                                  │
│  {                                                               │
│    "success": true,                                              │
│    "accounts": [                                                 │
│      { "accountId": "acc-1", "name": "Checking", ... },         │
│      { "accountId": "acc-2", "name": "Savings", ... }           │
│    ]                                                             │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              STEP 8: Frontend Receives & Processes Data          │
│  const data = await response.json()                             │
│  → Store in Zustand: accountsSlice.setAccounts(data.accounts)   │
│  → React re-renders with new data                               │
│  → User sees accounts list on screen                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Layer

### MongoDB Collections Schema

#### 1. Users Collection

```javascript
{
  _id: ObjectId("..."),
  customerId: "uuid-v4",           // Unique user identifier
  email: "john@example.com",       // Normalized (lowercase)
  password: "$2b$10$...",           // Bcrypt hash (only for credentials auth)
  firstName: "John",
  lastName: "Doe",
  emailVerified: true,             // Email verification status
  verificationToken: "uuid",       // Token for email verification (removed after verification)
  verificationTokenExpiry: Date,   // Token expiry (removed after verification)
  createdAt: Date,
  authProvider: "credentials",     // or "google"
  googleId: "123456789"            // Only for Google OAuth users
}
```

**Indexes:**
- `{ email: 1 }` - Unique
- `{ customerId: 1 }` - Unique
- `{ verificationToken: 1 }`

---

#### 2. Sessions Collection

```javascript
{
  _id: ObjectId("..."),
  sessionId: "uuid-v4",            // Unique session identifier
  customerId: "user-uuid",         // References users.customerId
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  createdAt: Date,                 // When session was created
  expiresAt: Date,                 // When session expires (createdAt + 7 days)
  lastAccessedAt: Date,            // Updated on every request
  userAgent: "Mozilla/5.0...",     // Browser/device info
  ipAddress: "192.168.1.100"       // User's IP address
}
```

**Indexes:**
- `{ sessionId: 1 }` - Unique (fast lookups)
- `{ customerId: 1 }` - For finding all user sessions
- `{ expiresAt: 1 }` - TTL index (auto-delete expired sessions)

---

#### 3. Accounts Collection

```javascript
{
  _id: ObjectId("..."),
  accountId: "uuid-v4",
  customerId: "user-uuid",         // References users.customerId
  name: "Chase Checking",
  type: "checking",
  balance: 5000.00,
  currency: "USD",
  institutionId: "chase",
  lastSynced: Date
}
```

**Indexes:**
- `{ customerId: 1 }`
- `{ accountId: 1 }` - Unique

---

#### 4. Transactions Collection

```javascript
{
  _id: ObjectId("..."),
  transactionId: "uuid-v4",
  customerId: "user-uuid",
  accountId: "account-uuid",
  amount: -45.99,
  description: "Starbucks Coffee",
  category: "Food & Dining",
  date: Date,
  pending: false
}
```

**Indexes:**
- `{ customerId: 1, date: -1 }` - Compound index for filtering by user and sorting by date
- `{ transactionId: 1 }` - Unique

---

#### 5. Budgets Collection

```javascript
{
  _id: ObjectId("..."),
  customerId: "user-uuid",
  totalBudgetLimit: 3000,
  categories: [
    {
      categoryId: "uuid-v4",
      name: "Groceries",
      limit: 500,
      spent: 234.56,
      color: "#4CAF50"
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ customerId: 1 }` - Unique

---

#### 6. Settings Collection

```javascript
{
  _id: ObjectId("..."),
  customerId: "user-uuid",
  currency: "USD",
  theme: "light",
  notifications: {
    email: true,
    push: false
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ customerId: 1 }` - Unique

---

## Security Model

### 1. Cookie Security

```typescript
res.cookie('session-id', sessionId, {
  httpOnly: true,      // ← JavaScript cannot access (prevents XSS attacks)
  secure: true,        // ← Only sent over HTTPS in production
  sameSite: 'lax',     // ← Prevents CSRF attacks
  maxAge: 604800000,   // ← 7 days (automatic expiry)
  path: '/'            // ← Available on all routes
})
```

**Security Features:**

| Feature | Purpose | Attack Prevented |
|---------|---------|------------------|
| `httpOnly` | Cookie inaccessible to JavaScript | XSS (Cross-Site Scripting) |
| `secure` | Only transmitted over HTTPS | Man-in-the-middle attacks |
| `sameSite: 'lax'` | Cookie not sent with cross-origin requests | CSRF (Cross-Site Request Forgery) |
| `maxAge` | Automatic expiry after 7 days | Indefinite session hijacking |

---

### 2. Session Validation on Every Request

**Before (JWT - Stateless):**
```typescript
// JWT is valid until expiry - can't revoke
const decoded = jwt.verify(token, SECRET)
// Token is valid even if user logged out!
```

**After (Sessions - Stateful):**
```typescript
// Database lookup on every request
const session = await db.collection('sessions').findOne({ sessionId })

if (!session) {
  return res.status(401).json({ message: 'Invalid session' })
}

if (session.expiresAt < new Date()) {
  await db.collection('sessions').deleteOne({ sessionId })
  return res.status(401).json({ message: 'Session expired' })
}

// Session is valid AND exists in database
```

**Benefits:**
- ✅ Instant revocation (delete from DB)
- ✅ Can't forge session ID (must exist in database)
- ✅ Compromised session can be immediately invalidated
- ✅ Logout from all devices support

---

### 3. Password Security

```typescript
// Signup: Hash password before storing
const hashedPassword = await bcrypt.hash(password, 10) // 10 salt rounds

await db.collection('users').insertOne({
  email,
  password: hashedPassword, // Never store plaintext!
  ...
})

// Login: Compare plaintext with hash
const passwordMatch = await bcrypt.compare(password, user.password)
```

---

### 4. Email Verification

```typescript
// Signup: Generate verification token
const verificationToken = randomUUID()
const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

// Store in user document
await db.collection('users').insertOne({
  email,
  emailVerified: false,
  verificationToken,
  verificationTokenExpiry,
  ...
})

// Send email with verification link
await sendVerificationEmail(email, name, verificationToken)
// Link: http://localhost:3000/verify-email?token=UUID

// Verification endpoint
authRoutes.get('/verify-email', async (req, res) => {
  const { token } = req.query
  
  const user = await db.collection('users').findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() } // Token not expired
  })
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' })
  }
  
  // Mark email as verified
  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true },
      $unset: { verificationToken: '', verificationTokenExpiry: '' }
    }
  )
  
  res.json({ success: true, message: 'Email verified!' })
})
```

---

### 5. Session Metadata Tracking

Every session stores:
- `userAgent` - Browser/device information
- `ipAddress` - User's IP address
- `createdAt` - When session was created
- `lastAccessedAt` - Last time session was used

**Use cases:**
- Detect suspicious login from new device/location
- Show user their active sessions with device info
- Allow revoking specific sessions

---

## Frontend Integration

### 1. Zustand Session Store

**Location:** Frontend (`/packages/web/src/store/sessionSlice.ts`)

```typescript
interface SessionState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await apiService.login(email, password)
    set({
      user: response.user,
      isAuthenticated: true,
      isLoading: false
    })
  },

  logout: async () => {
    await apiService.logout()
    set({
      user: null,
      isAuthenticated: false
    })
  },

  checkSession: async () => {
    try {
      const response = await apiService.checkSession()
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }
}))
```

---

### 2. Session Check on App Load

**Location:** Frontend (`/packages/web/src/app/layout.tsx` or `providers`)

```typescript
useEffect(() => {
  // Check if session is valid on app load
  sessionStore.checkSession()
}, [])
```

**What this does:**
1. Sends request to backend: `GET /api/session`
2. Backend checks `session-id` cookie
3. If valid, returns user data
4. If invalid, returns 401
5. Frontend updates Zustand store accordingly

---

### 3. Protected Routes

**Location:** Frontend (`/packages/web/src/app/[customerId]/layout.tsx`)

```typescript
export default function AuthenticatedLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { customerId: string }
}) {
  const { isAuthenticated, isLoading, user } = useSessionStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not logged in - redirect to login
      window.location.href = '/login'
    }
    
    if (!isLoading && isAuthenticated && user?.customerId !== params.customerId) {
      // Logged in as different user - redirect to correct dashboard
      window.location.href = `/${user.customerId}/dashboard`
    }
  }, [isAuthenticated, isLoading, user, params.customerId])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}
```

---

### 4. Next.js API Route Proxy (OAuth Callback)

**Location:** Frontend (`/packages/web/src/app/api/callback/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // Forward OAuth callback to backend
  const backendUrl = `http://localhost:3001/api/auth/google/callback?code=${code}`
  const response = await fetch(backendUrl, {
    method: 'GET',
    credentials: 'include', // Forward cookies
    headers: {
      'Cookie': request.headers.get('cookie') || ''
    }
  })

  // Backend will set session-id cookie and return redirect HTML
  const html = await response.text()
  
  // Create response with the HTML and forward the Set-Cookie header
  const nextResponse = new NextResponse(html, {
    status: response.status,
    headers: {
      'Content-Type': 'text/html'
    }
  })

  // Forward session-id cookie from backend to client
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    nextResponse.headers.set('Set-Cookie', setCookie)
  }

  return nextResponse
}
```

---

## Complete Flow Summary

### Credentials Login Flow

```
1. User submits email + password
   ↓
2. Backend validates credentials
   ↓
3. Backend creates session in MongoDB
   ↓
4. Backend sets session-id cookie
   ↓
5. Frontend receives user data + cookie
   ↓
6. Frontend stores user in Zustand
   ↓
7. User is redirected to dashboard
   ↓
8. Every subsequent request includes session-id cookie
   ↓
9. Middleware validates session on every request
   ↓
10. Route handlers access req.user (customerId, email, etc.)
```

---

### Google OAuth Login Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Backend redirects to Google login page
   ↓
3. User logs in at Google
   ↓
4. Google redirects to backend callback with code
   ↓
5. Backend exchanges code for access token
   ↓
6. Backend fetches user info from Google
   ↓
7. Backend creates/updates user in MongoDB
   ↓
8. Backend creates session in MongoDB
   ↓
9. Backend sets session-id cookie
   ↓
10. Backend sends redirect HTML with inline script
   ↓
11. Browser redirects to dashboard (with cookie)
   ↓
12. Dashboard loads with user authenticated
```

---

### Protected API Request Flow

```
1. User navigates to /accounts page
   ↓
2. Frontend calls apiService.getAccounts(customerId)
   ↓
3. Request sent with credentials: 'include'
   ↓
4. Browser automatically attaches session-id cookie
   ↓
5. Backend receives request with cookie
   ↓
6. authMiddleware extracts session-id
   ↓
7. authMiddleware calls getSession(sessionId)
   ↓
8. MongoDB lookup: db.collection('sessions').findOne({ sessionId })
   ↓
9. Session found and valid
   ↓
10. Session data attached to req.user
   ↓
11. Route handler executes
   ↓
12. MongoDB query: db.collection('accounts').find({ customerId })
   ↓
13. Accounts data returned to frontend
   ↓
14. Frontend updates Zustand store
   ↓
15. React re-renders with new data
```

---

### Logout Flow

```
1. User clicks "Logout"
   ↓
2. Frontend calls apiService.logout()
   ↓
3. Request sent with session-id cookie
   ↓
4. Backend extracts sessionId from req.sessionId
   ↓
5. Backend calls deleteSession(sessionId)
   ↓
6. MongoDB: db.collection('sessions').deleteOne({ sessionId })
   ↓
7. Backend clears session-id cookie
   ↓
8. Response sent to frontend
   ↓
9. Frontend clears Zustand store
   ↓
10. User redirected to login page
```

---

## Environment Variables

### Backend (`/packages/backend/.env`)

```bash
# Server
NODE_ENV=development
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/money-mapper

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Tink Integration
TINK_CLIENT_ID=your-tink-client-id
TINK_CLIENT_SECRET=your-tink-client-secret
```

### Frontend (`/packages/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Key Takeaways

### 1. Session-Based Authentication Benefits

✅ **Instant Revocation**: Delete session from DB immediately  
✅ **Multi-Device Logout**: Delete all sessions for a user  
✅ **Session Tracking**: See all active sessions with device info  
✅ **Compromised Token Response**: Delete session, user must re-login  
✅ **No Token Forgery**: Session must exist in database  

### 2. Cookie-Based Session Transport

✅ **HttpOnly**: JavaScript can't access (XSS protection)  
✅ **Secure**: Only sent over HTTPS in production  
✅ **SameSite**: Prevents CSRF attacks  
✅ **Automatic**: Browser handles cookie transmission  

### 3. Database-Driven Validation

✅ **Every request validated**: Lookup in MongoDB  
✅ **Real-time metadata**: Track lastAccessedAt, userAgent, IP  
✅ **TTL index**: MongoDB auto-deletes expired sessions  
✅ **Manual cleanup**: Hourly job as backup  

### 4. Frontend Integration

✅ **Zustand store**: Centralized session state  
✅ **API service layer**: Consistent `credentials: 'include'`  
✅ **Protected routes**: Check auth status before rendering  
✅ **Automatic redirects**: 401 → login page  

---

## Next Steps

### Remaining Tasks:

1. **Update Frontend Cookie Name**
   - Change from `auth-token` to `session-id` in frontend code
   - Update any cookie utilities

2. **Test Complete Flow**
   - Test credentials login → session creation → protected routes
   - Test Google OAuth → session creation → dashboard redirect
   - Test logout → session deletion → redirect to login
   - Test expired session → automatic cleanup → 401 response

3. **Add Session Management UI**
   - Settings page showing active sessions
   - "Logout from this device" button
   - "Logout from all devices" button

4. **Performance Optimization (Optional)**
   - Add Redis for session storage (faster than MongoDB)
   - Implement session caching strategy
   - Add rate limiting per session

---

## File References

### Backend Files:
- `/packages/backend/src/routes/auth.ts` - Authentication endpoints
- `/packages/backend/src/services/session.ts` - Session management functions
- `/packages/backend/src/middleware/middleware.ts` - Session validation middleware
- `/packages/backend/src/db/indexes/session-indexer.ts` - MongoDB indexes
- `/packages/backend/src/config.ts` - Environment configuration
- `/packages/backend/src/index.ts` - Server setup + cleanup jobs

### Frontend Files:
- `/packages/web/src/lib/api-service.ts` - API communication layer
- `/packages/web/src/store/sessionSlice.ts` - Zustand session store
- `/packages/web/src/app/login/page.tsx` - Login page
- `/packages/web/src/app/[customerId]/layout.tsx` - Protected route wrapper
- `/packages/web/src/app/api/callback/route.ts` - OAuth callback proxy

---

**Last Updated:** November 16, 2025  
**Authentication Method:** Session-based (replaced JWT)  
**Session Storage:** MongoDB with TTL indexes  
**Session Duration:** 7 days  
**Cookie Name:** `session-id`
