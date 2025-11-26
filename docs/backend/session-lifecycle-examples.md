# Session Lifecycle Examples

## Example 1: User Logs Out Manually

```
Timeline:
Nov 16, 10:00 AM - User logs in
Nov 16, 10:05 AM - User clicks "Logout"
```

### What Happens:

**1. Login (10:00 AM)**
```javascript
// POST /api/auth/login
const sessionId = await createSession(
  "user-789",
  "john@example.com",
  "John",
  "Doe"
)

// MongoDB sessions collection
{
  sessionId: "abc-123-def",
  customerId: "user-789",
  email: "john@example.com",
  createdAt: "2025-11-16T10:00:00Z",
  expiresAt: "2025-11-23T10:00:00Z",  // ← 7 days later
  lastAccessedAt: "2025-11-16T10:00:00Z"
}

// Cookie set in browser
session-id=abc-123-def
```

**2. User Browses App (10:01-10:04 AM)**
```javascript
// Every request:
GET /api/accounts
→ authMiddleware reads cookie: "abc-123-def"
→ getSession("abc-123-def")
→ Checks: expiresAt (Nov 23) > now (Nov 16) ✅
→ Updates lastAccessedAt
→ Request succeeds
```

**3. Logout (10:05 AM)**
```javascript
// POST /api/auth/logout
await deleteSession("abc-123-def")  // ← MongoDB deleteOne()

// MongoDB sessions collection
(session deleted - doesn't exist anymore)

// Cookie cleared from browser
session-id=(removed)
```

**4. User Tries to Access App (10:06 AM)**
```javascript
// Browser still has old cookie in memory? Doesn't matter, it was cleared
GET /api/accounts
→ No session-id cookie
→ 401 Unauthorized
→ Redirect to login page
```

**Key Point:** `expiresAt` was Nov 23 (6 days away), but logout **immediately deleted** the session. The expiry date doesn't matter when user logs out.

---

## Example 2: User Forgets to Log Out (Session Expires)

```
Timeline:
Nov 16, 10:00 AM - User logs in
Nov 16, 10:05 AM - User closes browser (no logout)
Nov 20, 3:00 PM - User comes back
Nov 24, 2:00 PM - User tries to access app again
```

### What Happens:

**1. Login (Nov 16, 10:00 AM)**
```javascript
// Same as Example 1
{
  sessionId: "xyz-789-ghi",
  customerId: "user-456",
  expiresAt: "2025-11-23T10:00:00Z",  // ← 7 days later
}

// Cookie set
session-id=xyz-789-ghi
```

**2. User Closes Browser (Nov 16, 10:05 AM)**
```javascript
// No logout request sent
// Session still exists in database ✅
// Cookie still stored in browser ✅

// MongoDB sessions collection
{
  sessionId: "xyz-789-ghi",
  expiresAt: "2025-11-23T10:00:00Z",  // ← Still valid
}
```

**3. User Returns (Nov 20, 3:00 PM)**
```javascript
// User opens app
// Browser automatically sends cookie: session-id=xyz-789-ghi

GET /api/accounts
→ authMiddleware reads cookie: "xyz-789-ghi"
→ getSession("xyz-789-ghi")
→ Checks: expiresAt (Nov 23) > now (Nov 20) ✅
→ Session valid!
→ User stays logged in (no need to log in again)
```

**4. Session Expires (Nov 23, 10:00 AM)**
```javascript
// MongoDB TTL index checks every 60 seconds
// At some point between 10:00 AM - 10:01 AM:

// TTL process finds:
{
  sessionId: "xyz-789-ghi",
  expiresAt: "2025-11-23T10:00:00Z"  // ← Now <= current time
}

// TTL deletes the session
→ Session removed from database 🗑️

// MongoDB sessions collection
(session deleted automatically)
```

**5. User Tries to Access App (Nov 24, 2:00 PM)**
```javascript
// Browser still has cookie (cookies don't auto-expire on client)
// Cookie: session-id=xyz-789-ghi

GET /api/accounts
→ authMiddleware reads cookie: "xyz-789-ghi"
→ getSession("xyz-789-ghi")
→ MongoDB query: findOne({ sessionId: "xyz-789-ghi", expiresAt: { $gt: now } })
→ Returns null (session doesn't exist + expired)
→ 401 Unauthorized
→ User redirected to login page
```

**Key Point:** User didn't log out, but after 7 days the session automatically expired and was deleted. The `expiresAt` field **controlled** when the session became invalid.

---

## Example 3: Suspicious Activity - Admin Force Logout

```
Timeline:
Nov 16, 10:00 AM - User logs in on laptop
Nov 16, 11:00 AM - User logs in on phone
Nov 16, 2:00 PM - Admin detects suspicious activity
```

### What Happens:

**1. User Has 2 Active Sessions**
```javascript
// MongoDB sessions collection
[
  {
    sessionId: "laptop-session-123",
    customerId: "user-456",
    expiresAt: "2025-11-23T10:00:00Z",  // ← 7 days
    userAgent: "Mozilla/5.0 (Macintosh...)",
    ipAddress: "192.168.1.100"
  },
  {
    sessionId: "phone-session-456",
    customerId: "user-456",
    expiresAt: "2025-11-23T11:00:00Z",  // ← 7 days
    userAgent: "Mozilla/5.0 (iPhone...)",
    ipAddress: "192.168.1.101"
  }
]
```

**2. Admin Logs Out All Devices (2:00 PM)**
```javascript
// POST /api/auth/logout-all
await deleteAllUserSessions("user-456")

// Deletes BOTH sessions immediately
// MongoDB sessions collection
(both sessions deleted)
```

**3. User Tries to Use App on Either Device**
```javascript
// Laptop:
GET /api/accounts
→ Cookie: session-id=laptop-session-123
→ getSession("laptop-session-123")
→ Returns null (session deleted)
→ 401 Unauthorized

// Phone:
GET /api/accounts
→ Cookie: session-id=phone-session-456
→ getSession("phone-session-456")
→ Returns null (session deleted)
→ 401 Unauthorized
```

**Key Point:** Both sessions had 6 days left until `expiresAt`, but `deleteAllUserSessions()` **ignored** the expiry date and deleted them immediately for security reasons.

---

## Summary: expiresAt vs Logout

### `expiresAt` Purpose:
- ✅ Automatic expiry for idle/forgotten sessions
- ✅ Prevents sessions from living forever
- ✅ Security: Even if user forgets to log out, session expires
- ✅ Used by TTL index for automatic cleanup

### `logout` Purpose:
- ✅ Immediate session termination
- ✅ User-initiated security action
- ✅ Allows instant revocation
- ✅ Ignores `expiresAt` - deletes immediately

### They Work Together:
```
┌─────────────────────────────────────────────────┐
│  Session Security has TWO layers:               │
│                                                  │
│  1. Manual Control (logout)                     │
│     → User can end session anytime              │
│                                                  │
│  2. Automatic Expiry (expiresAt)                │
│     → Session ends even if user forgets         │
│                                                  │
│  Result: Sessions are BOTH user-controlled      │
│          AND time-limited for security          │
└─────────────────────────────────────────────────┘
```

### Which Takes Precedence?
**Whichever happens FIRST:**
- If user logs out on day 3 → Session deleted (logout wins)
- If user never logs out → Session expires on day 7 (expiresAt wins)
- If admin revokes access → All sessions deleted (logout-all wins)
