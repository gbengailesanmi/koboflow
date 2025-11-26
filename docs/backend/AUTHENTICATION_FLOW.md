# 🔐 Authentication & Session Flow - Money Mapper

> **Complete guide to how authentication, sessions, and API communication work in Money Mapper**

Last Updated: November 16, 2025

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Methods](#authentication-methods)
3. [Session Management](#session-management)
4. [Complete User Journeys](#complete-user-journeys)
5. [API Communication](#api-communication)
6. [Security Features](#security-features)
7. [Database Schema](#database-schema)
8. [Frontend Integration](#frontend-integration)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  (Next.js 15 - http://localhost:3000)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Pages   │→ │  API Service │→ │ Next.js API  │     │
│  │              │  │  Functions   │  │    Routes    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓                                    ↓              │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Zustand Store (Client State)            │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + Cookies
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  (Express.js - http://localhost:3001)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     CORS     │→ │    Cookie    │→ │  Auth Routes │     │
│  │  Middleware  │  │    Parser    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓                                    ↓              │
│  ┌──────────────────────────────────────────────────┐     │
│  │          Auth Middleware (Every Request)          │     │
│  │  1. Read session-id cookie                        │     │
│  │  2. Lookup session in MongoDB                     │     │
│  │  3. Attach user data to req.user                  │     │
│  └──────────────────────────────────────────────────┘     │
│         ↓                                    ↓              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Session    │→ │   Protected  │→ │   Business   │     │
│  │   Service    │  │    Routes    │  │    Logic     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   users     │ │  sessions   │ │  settings   │          │
│  │             │ │             │ │             │          │
│  │ • email     │ │ • sessionId │ │ • currency  │          │
│  │ • password  │ │ • customerId│ │ • language  │          │
│  │ • customerId│ │ • expiresAt │ │ • timezone  │          │
│  │ • verified  │ │ • userAgent │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ transactions│ │  accounts   │ │   budgets   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Authentication Methods

### 1. Credentials Authentication (Email + Password)

#### Signup Flow

```
User                 Frontend              Backend              MongoDB
  │                     │                     │                    │
  │ Fill signup form    │                     │                    │
  ├────────────────────→│                     │                    │
  │                     │ POST /api/auth/signup                   │
  │                     ├────────────────────→│                    │
  │                     │                     │ Check existing user│
  │                     │                     ├───────────────────→│
  │                     │                     │                    │
  │                     │                     │ Hash password      │
  │                     │                     │ (bcrypt, 10 rounds)│
  │                     │                     │                    │
  │                     │                     │ Create user doc    │
  │                     │                     ├───────────────────→│
  │                     │                     │ {                  │
  │                     │                     │   email,           │
  │                     │                     │   password: hash,  │
  │                     │                     │   customerId: UUID,│
  │                     │                     │   emailVerified: false,│
  │                     │                     │   verificationToken,│
  │                     │                     │   authProvider: 'credentials'│
  │                     │                     │ }                  │
  │                     │                     │                    │
  │                     │                     │ Create settings    │
  │                     │                     ├───────────────────→│
  │                     │                     │                    │
  │                     │ Send verification   │                    │
  │                     │ email (Resend)      │                    │
  │                     │←────────────────────┤                    │
  │                     │                     │                    │
  │ Check email         │                     │                    │
  │←────────────────────┤                     │                    │
```

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "passwordConfirm": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "message": "Account created! Please check your email to verify your account."
}
```

**Key Steps:**
1. Validate all fields are present
2. Check password match and length (min 8 chars)
3. Normalize email (trim + lowercase)
4. Check if email already exists
5. Hash password with bcrypt (10 salt rounds)
6. Generate UUID for `customerId`
7. Generate verification token (UUID) + 24h expiry
8. Insert user document in MongoDB
9. Create default user settings
10. Send verification email via Resend
11. If email fails, rollback user creation

---

#### Email Verification Flow

```
User                 Frontend              Backend              MongoDB
  │                     │                     │                    │
  │ Click email link    │                     │                    │
  ├────────────────────→│                     │                    │
  │                     │ GET /api/verify?token=xxx               │
  │                     ├────────────────────→│                    │
  │                     │                     │ Find user by token │
  │                     │                     │ & check expiry     │
  │                     │                     ├───────────────────→│
  │                     │                     │                    │
  │                     │                     │ Update user:       │
  │                     │                     │ • emailVerified=true│
  │                     │                     │ • remove token     │
  │                     │                     ├───────────────────→│
  │                     │                     │                    │
  │                     │ Success + redirect  │                    │
  │ Redirect to login   │←────────────────────┤                    │
  │←────────────────────┤                     │                    │
```

**Endpoint:** `GET /api/verify?token=<token>` (handled by Next.js API route)

**Backend Endpoint:** `POST /api/auth/verify-email`

**Request:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "customerId": "abc-123-def-456"
}
```

---

#### Login Flow (Creates Session)

```
User                 Frontend              Backend              MongoDB
  │                     │                     │                    │
  │ Enter credentials   │                     │                    │
  ├────────────────────→│                     │                    │
  │                     │ POST /api/auth/login                    │
  │                     ├────────────────────→│                    │
  │                     │                     │ Find user by email │
  │                     │                     ├───────────────────→│
  │                     │                     │                    │
  │                     │                     │ Check emailVerified│
  │                     │                     │ Compare password   │
  │                     │                     │ (bcrypt.compare)   │
  │                     │                     │                    │
  │                     │                     │ CREATE SESSION:    │
  │                     │                     ├───────────────────→│
  │                     │                     │ {                  │
  │                     │                     │   sessionId: UUID, │
  │                     │                     │   customerId,      │
  │                     │                     │   email,           │
  │                     │                     │   firstName,       │
  │                     │                     │   lastName,        │
  │                     │                     │   expiresAt: +7d,  │
  │                     │                     │   userAgent,       │
  │                     │                     │   ipAddress        │
  │                     │                     │ }                  │
  │                     │                     │                    │
  │                     │ Set-Cookie:         │                    │
  │                     │ session-id=<UUID>   │                    │
  │ Store cookie        │←────────────────────┤                    │
  │←────────────────────┤                     │                    │
  │                     │                     │                    │
  │ Redirect to         │                     │                    │
  │ /[customerId]/dashboard                   │                    │
  │←────────────────────┤                     │                    │
```

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "customerId": "abc-123-def",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response Headers:**
```
Set-Cookie: session-id=<uuid>; Max-Age=604800; Path=/; Domain=localhost; HttpOnly; SameSite=Lax
```

**Cookie Configuration:**
```typescript
// Development
Domain=localhost
HttpOnly=true
SameSite=Lax
Secure=false  // HTTP allowed
MaxAge=604800 (7 days)

// Production
Domain=<frontend-domain>
HttpOnly=true
SameSite=Lax
Secure=true   // HTTPS required
MaxAge=604800 (7 days)
```

---

### 2. Google OAuth Authentication

#### OAuth Flow

```
User                 Frontend       Backend        Google        MongoDB
  │                     │              │              │             │
  │ Click "Sign in      │              │              │             │
  │ with Google"        │              │              │             │
  ├────────────────────→│              │              │             │
  │                     │ GET /api/auth/google        │             │
  │                     ├─────────────→│              │             │
  │                     │              │ Build auth URL            │
  │                     │              │ with client_id            │
  │                     │              │ & redirect_uri            │
  │                     │              │              │             │
  │ Redirect to Google  │              │              │             │
  │ OAuth consent       │←─────────────┤              │             │
  ├─────────────────────┼──────────────┼─────────────→│             │
  │                     │              │              │             │
  │ Grant permissions   │              │              │             │
  ├─────────────────────┼──────────────┼─────────────→│             │
  │                     │              │              │             │
  │ Redirect to callback│              │              │             │
  │ with code           │              │←─────────────┤             │
  ├─────────────────────┼──────────────→              │             │
  │                     │              │              │             │
  │                     │  GET /api/auth/google/callback?code=xxx  │
  │                     ├─────────────→│              │             │
  │                     │              │ Exchange code│             │
  │                     │              │ for tokens   │             │
  │                     │              ├─────────────→│             │
  │                     │              │              │             │
  │                     │              │ access_token │             │
  │                     │              │←─────────────┤             │
  │                     │              │              │             │
  │                     │              │ Get user info│             │
  │                     │              ├─────────────→│             │
  │                     │              │              │             │
  │                     │              │ {            │             │
  │                     │              │   email,     │             │
  │                     │              │   name,      │             │
  │                     │              │   given_name,│             │
  │                     │              │   family_name│             │
  │                     │              │ }            │             │
  │                     │              │←─────────────┤             │
  │                     │              │              │             │
  │                     │              │ Find or create user        │
  │                     │              ├────────────────────────────→│
  │                     │              │ {                           │
  │                     │              │   email,                    │
  │                     │              │   customerId: UUID,         │
  │                     │              │   emailVerified: true,      │
  │                     │              │   authProvider: 'google',   │
  │                     │              │   googleId                  │
  │                     │              │ }                           │
  │                     │              │                             │
  │                     │              │ CREATE SESSION              │
  │                     │              ├────────────────────────────→│
  │                     │              │                             │
  │                     │ Set-Cookie + │                             │
  │                     │ HTML redirect│                             │
  │ Store cookie &      │←─────────────┤                             │
  │ redirect to         │              │                             │
  │ dashboard           │              │                             │
  │←────────────────────┤              │                             │
```

**Endpoint 1:** `GET /api/auth/google`

Redirects to:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=<GOOGLE_CLIENT_ID>&
  redirect_uri=<BACKEND_URL>/api/auth/google/callback&
  response_type=code&
  scope=openid%20email%20profile&
  access_type=offline&
  prompt=consent
```

**Endpoint 2:** `GET /api/auth/google/callback?code=<auth_code>`

**Process:**
1. Exchange authorization code for access token
2. Fetch user info from Google
3. Find or create user in MongoDB
4. Mark email as verified (Google pre-verifies)
5. Create session
6. Set `session-id` cookie
7. Return HTML with JavaScript redirect to dashboard

---

## 🎫 Session Management

### Session Document Structure

```typescript
interface SessionData {
  sessionId: string           // UUID, unique identifier
  customerId: string          // Links to user
  email: string               // User's email
  firstName?: string          // User's first name
  lastName?: string           // User's last name
  createdAt: Date            // When session was created
  expiresAt: Date            // Expiry time (7 days from creation)
  lastAccessedAt: Date       // Updated on every request
  userAgent?: string         // Browser info
  ipAddress?: string         // IP address
}
```

**Example Session Document:**
```json
{
  "_id": "674c8a1b2e3f4a5b6c7d8e9f",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "abc-123-def-456",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-11-16T10:00:00.000Z",
  "expiresAt": "2025-11-23T10:00:00.000Z",
  "lastAccessedAt": "2025-11-16T10:15:30.000Z",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "ipAddress": "192.168.1.100"
}
```

### MongoDB Indexes (Performance + Auto-Cleanup)

```javascript
// Unique index for fast lookups
{ sessionId: 1 }, { unique: true, name: 'sessionId_unique' }

// Index for finding all user sessions
{ customerId: 1 }, { name: 'customerId_asc' }

// TTL index - MongoDB auto-deletes expired sessions
{ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expiresAt_ttl' }
```

**Create indexes:**
```bash
cd packages/backend
npm run index:sessions
```

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

1. LOGIN (Session Creation)
   ├─ User logs in successfully
   ├─ Backend calls createSession()
   ├─ Session document created in MongoDB
   ├─ expiresAt = now + 7 days
   └─ session-id cookie sent to browser

2. ACTIVE USAGE (Session Validation)
   ├─ Browser automatically sends session-id cookie with every request
   ├─ Auth middleware reads cookie
   ├─ Calls getSession(sessionId)
   ├─ MongoDB lookup: sessions.findOne({ sessionId, expiresAt: { $gt: now } })
   │
   ├─ IF SESSION FOUND & NOT EXPIRED:
   │  ├─ Update lastAccessedAt
   │  ├─ Attach user data to req.user
   │  └─ Request continues to protected route ✅
   │
   └─ IF SESSION NOT FOUND OR EXPIRED:
      ├─ Return 401 Unauthorized ❌
      └─ Frontend redirects to login

3. MANUAL LOGOUT (Instant Revocation)
   ├─ User clicks "Logout"
   ├─ Frontend calls POST /api/auth/logout
   ├─ Backend calls deleteSession(sessionId)
   ├─ Session deleted from MongoDB immediately
   ├─ Cookie cleared from browser
   └─ User must log in again

4. LOGOUT ALL DEVICES
   ├─ User clicks "Logout from all devices"
   ├─ Frontend calls POST /api/auth/logout-all
   ├─ Backend calls deleteAllUserSessions(customerId)
   ├─ ALL sessions for this user deleted
   └─ All devices must re-authenticate

5. AUTO EXPIRY (Time-based)
   ├─ Session reaches expiresAt date (7 days)
   ├─ getSession() returns null (expiresAt check)
   ├─ MongoDB TTL index deletes document within 60 seconds
   └─ User must log in again

6. CLEANUP (Automatic)
   ├─ MongoDB TTL index runs every 60 seconds
   ├─ Deletes sessions where expiresAt <= now
   │
   └─ PLUS: Hourly cleanup job in index.ts
      ├─ Runs cleanupExpiredSessions() every hour
      └─ Runs on server startup
```

### Session Service Functions

**File:** `/packages/backend/src/services/session.ts`

```typescript
// Create new session
createSession(
  customerId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> // Returns sessionId

// Get session (validates expiry)
getSession(sessionId: string): Promise<SessionData | null>

// Delete specific session (logout)
deleteSession(sessionId: string): Promise<boolean>

// Delete all user sessions (logout all devices)
deleteAllUserSessions(customerId: string): Promise<number>

// Get all active sessions for a user
getUserSessions(customerId: string): Promise<SessionData[]>

// Clean up expired sessions (called hourly)
cleanupExpiredSessions(): Promise<number>

// Extend session expiry
extendSession(sessionId: string, days: number = 7): Promise<boolean>
```

---

## 🛣️ Complete User Journeys

### Journey 1: New User Signup → Login

```
Step 1: SIGNUP
┌─────────────────────────────────────────────────────────┐
│ Frontend: /signup                                        │
│ User fills form → POST /api/auth/signup                 │
│                                                          │
│ Backend:                                                 │
│ 1. Validate input                                       │
│ 2. Hash password (bcrypt)                               │
│ 3. Create user (emailVerified: false)                   │
│ 4. Generate verification token                          │
│ 5. Send email (Resend)                                  │
│                                                          │
│ MongoDB: users collection                               │
│ {                                                        │
│   email: "john@example.com",                            │
│   password: "$2b$10$...",                               │
│   customerId: "abc-123",                                │
│   emailVerified: false,                                 │
│   verificationToken: "550e8400...",                     │
│   verificationTokenExpiry: Date(+24h)                   │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
              ↓
Step 2: EMAIL VERIFICATION
┌─────────────────────────────────────────────────────────┐
│ User clicks email link:                                  │
│ http://localhost:3000/api/verify?token=550e8400...      │
│                                                          │
│ Next.js API Route: /api/verify                          │
│ → Forwards to Backend: POST /api/auth/verify-email      │
│                                                          │
│ Backend:                                                 │
│ 1. Find user by token                                   │
│ 2. Check token not expired                              │
│ 3. Update: emailVerified = true                         │
│ 4. Remove verification token                            │
│                                                          │
│ Response: Redirect to /login?verified=true              │
└─────────────────────────────────────────────────────────┘
              ↓
Step 3: LOGIN (Creates Session)
┌─────────────────────────────────────────────────────────┐
│ Frontend: /login                                         │
│ User enters credentials → POST /api/auth/login          │
│                                                          │
│ Backend:                                                 │
│ 1. Find user by email                                   │
│ 2. Check emailVerified = true                           │
│ 3. Compare password hash                                │
│ 4. Create session in MongoDB:                           │
│    {                                                     │
│      sessionId: "uuid-1234",                            │
│      customerId: "abc-123",                             │
│      expiresAt: Date(+7 days)                           │
│    }                                                     │
│ 5. Set cookie: session-id=uuid-1234                     │
│                                                          │
│ Frontend:                                                │
│ 1. Receives session-id cookie                           │
│ 2. Stores user data in Zustand                          │
│ 3. Redirects to /abc-123/dashboard                      │
└─────────────────────────────────────────────────────────┘
              ↓
Step 4: ACCESSING PROTECTED ROUTES
┌─────────────────────────────────────────────────────────┐
│ User navigates to /abc-123/analytics                     │
│                                                          │
│ Frontend:                                                │
│ 1. Page component calls getSession() on mount           │
│ 2. api-service.ts → GET /api/session                    │
│ 3. Browser sends session-id cookie automatically        │
│                                                          │
│ Backend Auth Middleware (runs on EVERY request):        │
│ 1. Read session-id from cookie                          │
│ 2. Call getSession(sessionId)                           │
│ 3. MongoDB: Find session where:                         │
│    - sessionId matches                                  │
│    - expiresAt > now                                    │
│ 4. IF FOUND:                                            │
│    - Update lastAccessedAt                              │
│    - Attach to req.user                                 │
│    - Continue to route ✅                               │
│    ELSE:                                                 │
│    - Return 401 ❌                                      │
│                                                          │
│ Protected Route: /api/session                           │
│ 1. Access req.user (set by middleware)                  │
│ 2. Fetch additional data (settings, budget)            │
│ 3. Return user info                                     │
│                                                          │
│ Frontend:                                                │
│ 1. Receives user data                                   │
│ 2. Updates Zustand store                                │
│ 3. Renders page                                         │
└─────────────────────────────────────────────────────────┘
```

### Journey 2: Google OAuth Login

```
Step 1: INITIATE OAUTH
┌─────────────────────────────────────────────────────────┐
│ Frontend: User clicks "Sign in with Google"             │
│ → GET /api/auth/google                                  │
│                                                          │
│ Backend:                                                 │
│ 1. Build Google OAuth URL                               │
│ 2. Redirect to Google consent screen                    │
│                                                          │
│ Google:                                                  │
│ User grants permissions → redirect with code            │
└─────────────────────────────────────────────────────────┘
              ↓
Step 2: OAUTH CALLBACK
┌─────────────────────────────────────────────────────────┐
│ Google redirects to:                                     │
│ /api/auth/google/callback?code=xyz789                   │
│                                                          │
│ Backend:                                                 │
│ 1. Exchange code for access_token                       │
│ 2. Fetch user info from Google                          │
│ 3. Find or create user in MongoDB:                      │
│    IF NEW USER:                                          │
│      - Create user document                             │
│      - emailVerified: true (Google verified)            │
│      - authProvider: 'google'                           │
│      - Create settings                                  │
│    IF EXISTING USER:                                     │
│      - Update emailVerified if needed                   │
│                                                          │
│ 4. Create session (same as credentials login)           │
│ 5. Set session-id cookie                                │
│ 6. Return HTML with JavaScript redirect                 │
│                                                          │
│ Frontend:                                                │
│ 1. Receives cookie                                      │
│ 2. Redirects to /[customerId]/dashboard                 │
└─────────────────────────────────────────────────────────┘
```

### Journey 3: Logout

```
┌─────────────────────────────────────────────────────────┐
│ SINGLE DEVICE LOGOUT                                     │
├─────────────────────────────────────────────────────────┤
│ User clicks "Logout" → POST /api/auth/logout            │
│                                                          │
│ Backend:                                                 │
│ 1. Auth middleware provides sessionId                   │
│ 2. deleteSession(sessionId)                             │
│ 3. MongoDB: sessions.deleteOne({ sessionId })           │
│ 4. Clear session-id cookie                              │
│                                                          │
│ Frontend:                                                │
│ 1. Clear Zustand store                                  │
│ 2. Redirect to /login                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ALL DEVICES LOGOUT                                       │
├─────────────────────────────────────────────────────────┤
│ User clicks "Logout from all devices"                   │
│ → POST /api/auth/logout-all                             │
│                                                          │
│ Backend:                                                 │
│ 1. Get customerId from req.user                         │
│ 2. deleteAllUserSessions(customerId)                    │
│ 3. MongoDB: sessions.deleteMany({ customerId })         │
│ 4. Clear session-id cookie                              │
│                                                          │
│ Result:                                                  │
│ - Current device: logged out                            │
│ - All other devices: next request gets 401              │
│ - All devices must re-authenticate                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API Communication

### Frontend API Service Architecture

**File:** `/packages/web/src/lib/api-service.ts`

All API calls go through centralized functions with:
- Automatic cookie handling
- Error handling
- Cache revalidation (Next.js)
- Console logging for debugging

```typescript
// Example API call
export async function getSession() {
  console.log('[API Service] getSession called')
  
  const response = await fetch(`${API_BASE_URL}/session`, {
    method: 'GET',
    credentials: 'include', // ← Sends cookies automatically
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      console.log('[API Service] Unauthorized - redirecting to login')
      redirect('/login')
    }
    throw new Error('Failed to fetch session')
  }

  const data = await response.json()
  console.log('[API Service] Session data received:', data)
  return data
}
```

### Request Flow

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND REQUEST FLOW                    │
└──────────────────────────────────────────────────────────┘

1. USER INTERACTION
   ↓
2. REACT COMPONENT
   ├─ useEffect / button click
   └─ Calls api-service function

3. API SERVICE (/lib/api-service.ts)
   ├─ Logs: [API Service] functionName called
   ├─ fetch(url, { credentials: 'include' })  ← Sends cookies
   ├─ Handles errors
   └─ Returns data

4. ZUSTAND STORE (optional)
   ├─ Stores data in global state
   └─ Triggers re-renders

5. COMPONENT UPDATES
   └─ Displays data to user

┌──────────────────────────────────────────────────────────┐
│                  BACKEND REQUEST FLOW                     │
└──────────────────────────────────────────────────────────┘

1. EXPRESS SERVER RECEIVES REQUEST
   ↓
2. CORS MIDDLEWARE
   ├─ Checks origin (localhost:3000 in dev)
   └─ Allows credentials

3. COOKIE PARSER
   ├─ Parses cookies from headers
   └─ Populates req.cookies

4. LOGGING MIDDLEWARE
   └─ Logs: [GET] /api/session - 200 (45ms)

5. AUTH MIDDLEWARE (if route protected)
   ├─ Reads req.cookies['session-id']
   ├─ Calls getSession(sessionId)
   ├─ MongoDB lookup
   ├─ IF VALID:
   │  ├─ Sets req.user = { customerId, email, ... }
   │  ├─ Sets req.sessionId = sessionId
   │  └─ next() ✅
   └─ IF INVALID:
      └─ Returns 401 ❌

6. ROUTE HANDLER
   ├─ Accesses req.user (set by middleware)
   ├─ Performs business logic
   ├─ Queries MongoDB
   └─ Returns response

7. RESPONSE
   └─ JSON data sent to frontend
```

### API Endpoints Reference

#### Authentication Routes (`/api/auth/*`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/signup` | ❌ | Create new account |
| POST | `/login` | ❌ | Login with credentials |
| POST | `/logout` | ✅ | Logout current device |
| POST | `/logout-all` | ✅ | Logout all devices |
| GET | `/sessions` | ✅ | List active sessions |
| POST | `/verify-email` | ❌ | Verify email token |
| POST | `/resend-verification` | ❌ | Resend verification email |
| GET | `/google` | ❌ | Initiate Google OAuth |
| GET | `/google/callback` | ❌ | Google OAuth callback |
| GET | `/user/:customerId` | ❌ | Get user info |
| PATCH | `/user/:customerId` | ❌ | Update user profile |

#### Session Route (`/api/session`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | ✅ | Get current session + user data |
| DELETE | `/` | ✅ | Logout (alias for /auth/logout) |

#### Protected Routes (All require auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | Get user's bank accounts |
| GET | `/api/transactions` | Get transactions |
| GET | `/api/budget` | Get budget data |
| POST | `/api/budget` | Create/update budget |
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update settings |
| GET | `/api/categories` | Get transaction categories |

---

## 🔒 Security Features

### 1. Password Security
```
- Bcrypt hashing (10 salt rounds)
- Min 8 characters required
- Password never stored in plain text
- Password never sent in responses
```

### 2. Cookie Security
```typescript
{
  httpOnly: true,        // ← JavaScript cannot access (prevents XSS)
  secure: IS_PRODUCTION, // ← HTTPS only in production
  sameSite: 'lax',      // ← CSRF protection
  maxAge: 604800000,    // ← 7 days
  path: '/',            // ← Available on all routes
  domain: 'localhost'   // ← Domain-specific (dev)
}
```

### 3. Session Security
- Random UUID session IDs (unguessable)
- Database validation on every request
- Automatic expiry after 7 days
- Instant revocation on logout
- IP address tracking
- User agent tracking
- Last accessed timestamp

### 4. CORS Protection
```typescript
{
  origin: ['http://localhost:3000'], // Only allow frontend
  credentials: true,                  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 5. Email Verification
- Required for credentials auth
- 24-hour token expiry
- One-time use tokens
- Token removed after verification

### 6. Input Validation
- Email normalization (trim + lowercase)
- Password confirmation check
- SQL injection prevention (MongoDB parameterized queries)
- XSS prevention (input sanitization)

---

## 💾 Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,              // Unique, normalized
  password?: string,          // Hashed with bcrypt (not present for OAuth)
  firstName: string,
  lastName: string,
  customerId: string,         // UUID, unique user identifier
  emailVerified: boolean,
  verificationToken?: string, // UUID, temporary
  verificationTokenExpiry?: Date,
  createdAt: Date,
  updatedAt?: Date,
  authProvider: 'credentials' | 'google',
  googleId?: string           // For OAuth users
}
```

**Indexes:**
- `{ email: 1 }` - Unique
- `{ customerId: 1 }` - Unique
- `{ verificationToken: 1 }`

### Sessions Collection

```typescript
{
  _id: ObjectId,
  sessionId: string,          // UUID, unique
  customerId: string,         // Links to user
  email: string,
  firstName?: string,
  lastName?: string,
  createdAt: Date,
  expiresAt: Date,           // TTL index deletes when reached
  lastAccessedAt: Date,      // Updated on every request
  userAgent?: string,
  ipAddress?: string
}
```

**Indexes:**
- `{ sessionId: 1 }` - Unique, for fast lookups
- `{ customerId: 1 }` - For finding all user sessions
- `{ expiresAt: 1 }` - TTL index (auto-delete expired)

### Settings Collection

```typescript
{
  _id: ObjectId,
  customerId: string,         // Links to user
  currency: string,           // e.g., 'SEK', 'USD'
  language: string,
  timezone: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ customerId: 1 }` - Unique

---

## 🎨 Frontend Integration

### Zustand Store (Global State)

**File:** `/packages/web/src/store/sessionSlice.ts`

```typescript
interface SessionState {
  user: {
    customerId: string
    email: string
    firstName: string
    lastName: string
    name: string
  } | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User) => void
  clearUser: () => void
  checkSession: () => Promise<void>
}
```

### Protected Pages Pattern

```typescript
// Example: /app/[customerId]/dashboard/page.tsx

export default async function DashboardPage() {
  // Server-side session check
  const session = await getSession()
  
  if (!session.success || !session.user) {
    redirect('/login')
  }

  const user = session.user

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      {/* Rest of dashboard */}
    </div>
  )
}
```

### API Call Pattern

```typescript
// In a component
'use client'

import { useEffect } from 'react'
import { getAccounts } from '@/lib/api-service'
import { useStore } from '@/store'

export function AccountsList() {
  const { accounts, setAccounts } = useStore()

  useEffect(() => {
    async function loadAccounts() {
      try {
        const data = await getAccounts() // ← Sends session-id cookie
        setAccounts(data.accounts)
      } catch (error) {
        console.error('Failed to load accounts:', error)
        // User might be redirected to login if 401
      }
    }

    loadAccounts()
  }, [])

  return (
    <ul>
      {accounts.map(account => (
        <li key={account.id}>{account.name}</li>
      ))}
    </ul>
  )
}
```

### Session Timeout Provider

**File:** `/packages/web/src/providers/session-timeout-provider.tsx`

Monitors user inactivity and shows warning before session expires.

```typescript
// Tracks:
// - Mouse movement
// - Keyboard input
// - Page navigation

// Shows modal:
// "Your session will expire in 2 minutes. Stay logged in?"

// On timeout:
// - Clears Zustand store
// - Redirects to login
```

---

## 📋 Summary: Key Points

### Authentication
- ✅ Two methods: Credentials (email/password) + Google OAuth
- ✅ Email verification required for credentials
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Google accounts auto-verified

### Sessions
- ✅ Stored in MongoDB (not JWT)
- ✅ 7-day expiry (configurable)
- ✅ Automatic cleanup (TTL index + hourly job)
- ✅ Instant revocation on logout
- ✅ Multi-device support with session list

### Security
- ✅ HttpOnly cookies (XSS prevention)
- ✅ SameSite cookies (CSRF prevention)
- ✅ HTTPS in production (Secure flag)
- ✅ Session validation on every request
- ✅ IP + User Agent tracking

### Frontend
- ✅ Centralized API service (`api-service.ts`)
- ✅ Automatic cookie handling (`credentials: 'include'`)
- ✅ Zustand for global state
- ✅ Server-side session checks in Next.js 15
- ✅ Client-side inactivity monitoring

### Backend
- ✅ Express.js with TypeScript
- ✅ MongoDB for persistence
- ✅ Auth middleware on protected routes
- ✅ Centralized config (`config.ts`)
- ✅ Session service for CRUD operations

---

## 🚀 Quick Reference

### How to Check if User is Authenticated

**Backend (any route):**
```typescript
// Protected route
app.get('/api/protected', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user // ← Set by authMiddleware
  const sessionId = req.sessionId
  
  // User is authenticated if we reach here
  res.json({ user })
})
```

**Frontend (Server Component):**
```typescript
const session = await getSession()
if (!session.success) {
  redirect('/login')
}
```

**Frontend (Client Component):**
```typescript
const { user, isAuthenticated } = useStore()

if (!isAuthenticated) {
  // Show login prompt or redirect
}
```

### How to Logout

**Frontend:**
```typescript
import { logout } from '@/lib/api-service'

async function handleLogout() {
  await logout()
  // User redirected to login automatically
}
```

**Backend handles:**
1. Delete session from MongoDB
2. Clear cookie
3. Return success

### How to Check Session Expiry

Sessions automatically expire after 7 days. On next request:
```
Browser sends session-id cookie
       ↓
Auth middleware calls getSession(sessionId)
       ↓
MongoDB query: { sessionId, expiresAt: { $gt: now } }
       ↓
If expired: returns null → 401 Unauthorized
       ↓
Frontend redirects to login
```

---

## 📝 Environment Variables Required

### Backend (`.env`)

```bash
# Server
NODE_ENV=development
BACKEND_PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017
MONGO_DB_NAME=money-mapper

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Email (Resend)
FROM_EMAIL=Money Mapper <noreply@moneymapper.com>
RESEND_API_KEY=re_xxxxx

# Tink API
TINK_CLIENT_ID=your-tink-client-id
TINK_CLIENT_SECRET=your-tink-secret

# Frontend
FRONTEND_URL=http://localhost:3000
FRONTEND_PORT=3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Other
BASE_URI=http://localhost
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎯 Troubleshooting

### Cookie Not Being Set

**Symptoms:** Session created but frontend doesn't receive cookie

**Solutions:**
1. Check CORS configuration allows credentials
2. Verify `credentials: 'include'` in fetch calls
3. Check cookie domain matches (localhost in dev)
4. Verify SameSite policy compatibility

### 401 Unauthorized on Every Request

**Symptoms:** User logs in but immediately gets 401

**Causes:**
1. Cookie not being sent with requests
2. Session expired or not found in database
3. Auth middleware not receiving cookie

**Debug:**
```typescript
// Add to auth middleware
console.log('Cookies:', req.cookies)
console.log('Session ID:', req.cookies?.['session-id'])
```

### Session Not Persisting

**Symptoms:** User logged out after page refresh

**Causes:**
1. Cookie not being saved by browser
2. Session deleted from database
3. MaxAge/expires too short

**Check:**
```bash
# MongoDB: Check sessions exist
db.sessions.find({ customerId: 'your-customer-id' })

# Browser: Check cookies in DevTools (Application → Cookies)
```

---

**End of Documentation** 🎉

*For more details, see:*
- `/packages/backend/docs/session-lifecycle-examples.md`
- `/packages/backend/src/services/session.ts`
- `/packages/web/src/lib/api-service.ts`
