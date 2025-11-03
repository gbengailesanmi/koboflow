# Authentication System - Consolidated Implementation

## Overview
This document outlines the new consolidated authentication system using NextAuth.js with unified session handling.

## User Journey

### 1. Landing Page (/)
- Shows two options: **Login** or **Sign Up**
- If user is already authenticated → Auto-redirect to dashboard
- Implemented in: `src/app/page.tsx`

### 2. Sign Up Flow
- User visits `/signup`
- If already logged in → Redirect to `/dashboard`
- Fill in form: First Name, Last Name, Email, Password, Confirm Password
- Option to sign up with Google OAuth
- On success → Auto-login → Redirect to dashboard
- Implemented in: `src/app/signup/page.tsx`, `src/app/forms/signup-form.tsx`, `src/app/actions/signup.ts`

### 3. Login Flow
- User visits `/login`
- If already logged in → Redirect to `/dashboard`
- Fill in form: Email, Password
- Option to login with Google OAuth
- On success → Redirect to dashboard
- Implemented in: `src/app/login/page.tsx`, `src/app/forms/login-form.tsx`, `src/app/actions/login.ts`

### 4. Session Handling
- Uses NextAuth.js with MongoDB adapter
- Session stored in database (not JWT cookies)
- Sessions persist for 7 days
- Automatic session timeout after 15 minutes of inactivity
- Implemented in: `src/auth.ts`, `src/lib/session.ts`

### 5. Route Protection
- NextAuth middleware protects all routes
- Uses `authorized` callback in auth.ts for route protection logic
- Public routes: `/`, `/login`, `/signup`, `/verify-email`, `/api/*`, `/auth-redirect`
- Authenticated users cannot access `/login` or `/signup`
- Unauthenticated users cannot access protected routes
- Implemented in: `src/middleware.ts` (exports NextAuth middleware), `src/auth.ts` (authorized callback)

## Key Files

### Core Authentication
- **`src/auth.ts`** - NextAuth configuration with Google OAuth and Credentials providers, includes `authorized` callback for route protection
- **`src/middleware.ts`** - Exports NextAuth middleware (Edge Runtime compatible)
- **`src/lib/session.ts`** - Unified session management using NextAuth

### Pages
- **`src/app/page.tsx`** - Landing page with Login/Sign Up options
- **`src/app/login/page.tsx`** - Login page
- **`src/app/signup/page.tsx`** - Sign up page

### Actions
- **`src/app/actions/login.ts`** - Login action using NextAuth credentials provider
- **`src/app/actions/signup.ts`** - Signup action with auto-login
- **`src/app/actions/logout.ts`** - Logout action using NextAuth signOut
- **`src/app/actions/google-signin.ts`** - Google OAuth signin action

### Forms
- **`src/app/forms/login-form.tsx`** - Login form component
- **`src/app/forms/signup-form.tsx`** - Signup form component

### API Routes
- **`src/app/api/session/route.ts`** - Session management API (GET, DELETE)
- **`src/app/auth-redirect/route.ts`** - Post-auth redirect handler

## Authentication Providers

### 1. Credentials Provider (Email/Password)
- Users sign up with email and password
- Passwords hashed with bcrypt
- Email verification set to auto-verify for now
- Login validates credentials and creates NextAuth session

### 2. Google OAuth Provider
- Users can sign in with Google
- Auto-creates user profile on first login
- Generates unique customerId
- Creates default user settings

## Session Strategy

### Database Sessions (NextAuth)
- All sessions stored in MongoDB via MongoDBAdapter
- No JWT cookies (removed old jwt_token approach)
- Session includes: customerId, email, name
- MaxAge: 7 days
- Session timeout: 15 minutes of inactivity

## Security Features

1. **Password Requirements** (via Zod schema):
   - Minimum 8 characters
   - Additional validation in SignupFormSchema

2. **Route Protection**:
   - Middleware checks authentication status
   - Redirects based on auth state

3. **HTTP-Only Cookies**:
   - Sessions stored server-side
   - Cookies managed by NextAuth

4. **CSRF Protection**:
   - Built into NextAuth

## Removed/Deprecated Files

### Deleted
- **`src/lib/redirect-if-auth.ts`** - Replaced by middleware

### No Longer Using
- JWT token authentication (jose, SignJWT)
- Manual cookie management for auth
- Separate session strategies for OAuth vs credentials

## Environment Variables Required

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Database
MONGODB_URI=<your-mongodb-uri>

# Session (legacy, can be removed if not used elsewhere)
SESSION_SECRET=<your-session-secret>
```

## Migration Notes

### What Changed
1. **Unified Authentication**: Both email/password and Google OAuth now use NextAuth
2. **Single Session Strategy**: Removed dual JWT + NextAuth session approach
3. **Middleware Protection**: Centralized route protection in middleware
4. **Auto-Login on Signup**: Users automatically logged in after successful signup
5. **Simplified Redirect Logic**: Single auth-redirect route for post-login handling

### Breaking Changes
- Old JWT tokens (`jwt_token` cookie) no longer valid
- Users will need to re-login after deployment
- `redirectIfAuth` helper function removed

## Future Enhancements

1. **Email Verification**: Re-enable email verification with Resend/SendGrid
2. **Password Reset**: Add forgot password flow
3. **Two-Factor Authentication**: Add 2FA support
4. **Social Logins**: Add more OAuth providers (GitHub, Apple, etc.)
5. **Account Linking**: Allow linking multiple auth methods to one account

## Testing Checklist

- [ ] Landing page shows Login/Sign Up options
- [ ] Signup with email/password creates account and auto-logs in
- [ ] Signup with Google creates account and logs in
- [ ] Login with email/password works
- [ ] Login with Google works
- [ ] Authenticated users redirected from /login to dashboard
- [ ] Authenticated users redirected from /signup to dashboard
- [ ] Unauthenticated users redirected from protected routes to login
- [ ] Session persists across page refreshes
- [ ] Session timeout works after 15 minutes
- [ ] Logout works correctly
- [ ] Multiple sessions (different browsers) work independently
