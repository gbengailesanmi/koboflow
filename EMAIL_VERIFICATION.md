# Email Verification Implementation Guide

This document explains the email verification system implemented for Money Mapper user signups.

## Overview

Users must verify their email address before they can access the application. The verification flow:

1. User signs up with email, password, first name, and last name
2. System creates unverified account and sends verification email
3. User clicks verification link in email
4. System verifies email and auto-logs in user
5. User is redirected to dashboard

## Files Created/Modified

### New Files Created:

1. **`/src/lib/email.ts`**
   - Resend email service integration
   - `sendVerificationEmail()` function with beautiful HTML template
   - Sends verification email with unique token

2. **`/src/app/api/verify-email/route.ts`**
   - GET endpoint to verify email tokens
   - Validates token, marks email as verified
   - Auto-logs in user after verification

3. **`/src/app/api/resend-verification/route.ts`**
   - POST endpoint to resend verification emails
   - Generates new token if previous expired
   - Security: doesn't reveal if email exists

4. **`/src/app/verify-email/page.tsx`**
   - Verification page UI
   - Shows "Check your email" message (no token)
   - Handles verification process (with token)
   - Success/error states with animations

5. **`/src/app/verify-email/verify-email.module.css`**
   - Styling for verification page
   - Responsive design
   - Loading spinner and animations

6. **`.env.example`**
   - Documents required environment variables

### Modified Files:

1. **`/src/app/actions/signup.ts`**
   - Added `verificationToken` and `verificationTokenExpiry` fields
   - Calls `sendVerificationEmail()` after user creation
   - No auto-login (waits for email verification)
   - Stores `emailVerified: false` initially

2. **`/src/app/actions/login.ts`**
   - Checks if email is verified before login
   - Shows error message if not verified

3. **`/src/app/forms/signup-form.tsx`**
   - Redirects to `/verify-email` after successful signup
   - Uses `useRouter` and `useEffect` for redirect

4. **`/src/lib/definitions.ts`**
   - Updated to use `firstName` and `lastName` instead of single `name`

## Database Schema Updates

The `users` collection now includes these fields:

```javascript
{
  email: string,
  password: string,  // hashed
  name: string,  // "FirstName LastName"
  firstName: string,
  lastName: string,
  customerId: string,
  emailVerified: boolean,  // NEW
  verificationToken: string,  // NEW (removed after verification)
  verificationTokenExpiry: Date,  // NEW (24 hours, removed after verification)
  verifiedAt: Date,  // NEW (set when verified)
  createdAt: Date,  // NEW
}
```

## Environment Variables Required

Add these to your `.env` file:

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# From Email (must be verified in Resend)
RESEND_FROM_EMAIL=Money Mapper <noreply@yourdomain.com>

# App URL for verification links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env` file

### 2. Verify Your Domain (Production)

For production, you must verify your domain in Resend:

1. Add your domain in Resend dashboard
2. Add DNS records (MX, TXT, CNAME)
3. Wait for verification
4. Update `RESEND_FROM_EMAIL` with your domain

### 3. Development Testing

For development, you can use:
- Resend's test email: `onboarding@resend.dev`
- This works without domain verification

## User Flow

### Signup Flow:

```
1. User fills signup form (firstName, lastName, email, password)
   ↓
2. System validates input
   ↓
3. System creates user with emailVerified: false
   ↓
4. System sends verification email
   ↓
5. User redirected to /verify-email (pending page)
   ↓
6. User checks email and clicks verification link
   ↓
7. System verifies token at /api/verify-email?token=xxx
   ↓
8. System marks email as verified
   ↓
9. System auto-logs in user
   ↓
10. User redirected to /[customerId]/dashboard
```

### Login Flow:

```
1. User enters email and password
   ↓
2. System validates credentials
   ↓
3. System checks if emailVerified === true
   ↓
4. If not verified: Show error message
   ↓
5. If verified: Login and redirect to dashboard
```

## API Endpoints

### GET `/api/verify-email?token={token}`

Verifies email with token.

**Query Params:**
- `token` - Verification token (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "customerId": "user-customer-id"
}
```

### POST `/api/resend-verification`

Resends verification email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## Email Template

The verification email includes:

- ✅ Professional gradient header
- ✅ Personalized greeting with user's first name
- ✅ Clear call-to-action button
- ✅ Alternative link for manual copy/paste
- ✅ 24-hour expiry notice
- ✅ Security note about ignoring if not signed up
- ✅ Responsive design for mobile
- ✅ Beautiful branding with Money Mapper colors

## Security Features

1. **Token Expiry**: Tokens expire after 24 hours
2. **One-time Use**: Tokens deleted after verification
3. **Email Privacy**: Resend endpoint doesn't reveal if email exists
4. **HTTPS Only**: Secure cookie transmission in production
5. **HttpOnly Cookies**: JWT stored in httpOnly cookies
6. **Hashed Passwords**: bcrypt with salt rounds

## Testing

### Test Email Verification:

1. Sign up with test email
2. Check console logs for verification URL (dev mode)
3. Visit verification URL
4. Should see success message and redirect

### Test Resend:

```bash
curl -X POST http://localhost:3000/api/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Troubleshooting

### Email not sending:

1. Check `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for failed sends
3. Check domain verification status
4. Check console logs for errors

### Token invalid/expired:

1. Check token hasn't been used already
2. Check 24-hour expiry hasn't passed
3. Use resend endpoint to get new token

### Already verified error:

- User already verified, can login directly

## Future Enhancements

Possible improvements:

- [ ] Add "Resend" button on verification page
- [ ] Email verification reminder after 24 hours
- [ ] Password reset via email
- [ ] Two-factor authentication
- [ ] Email notification preferences
- [ ] Welcome email after verification

## Support

For issues or questions:
- Check Resend dashboard for delivery status
- Check MongoDB for user verification status
- Check server logs for errors
