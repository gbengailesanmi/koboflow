# Login Bug Fix - "All fields are required"

## Issue

After signing up, verifying email, and attempting to login, users were seeing the error:
```
All fields are required.
```

Even though both email and password fields were filled in.

## Root Cause

**Function Signature Mismatch**

The `login` function in `api-service.ts` expects two **separate parameters**:
```typescript
// api-service.ts
export async function login(email: string, password: string): Promise<...>
```

But the login form was calling it with an **object**:
```typescript
// login-form.tsx (INCORRECT)
const result = await login({ email, password })  // ❌ Wrong!
```

This caused the function to receive `undefined` for both parameters, triggering the "All fields are required" validation error.

## The Fix

Changed the login form to pass parameters correctly:

### Before (Incorrect):
```typescript
const result: any = await login({ email, password })  // ❌ Object syntax
```

### After (Correct):
```typescript
const result: any = await login(email, password)  // ✅ Separate parameters
```

## Why This Happened

The `login` function signature is **inconsistent** with other auth functions:

```typescript
// ✅ signup uses object parameter
export async function signup(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<...>

// ❌ login uses separate parameters (inconsistent!)
export async function login(email: string, password: string): Promise<...>
```

The form developer likely assumed `login` would follow the same pattern as `signup`.

## Files Modified

- ✅ `/app/forms/login-form.tsx` - Fixed function call

## Recommendation: Make API Consistent

Consider updating `login` to accept an object for consistency:

```typescript
// Suggested change to api-service.ts
export async function login(credentials: {
  email: string
  password: string
}): Promise<...> {
  const { email, password } = credentials
  // ...rest of implementation
}
```

This would:
- ✅ Match the `signup` function pattern
- ✅ Make the API more consistent
- ✅ Prevent this type of bug in the future
- ✅ Make it easier to add optional parameters later

## Testing

✅ Test login with valid credentials
✅ Test login with invalid credentials  
✅ Test login with empty fields
✅ Test login after email verification
✅ Test "All fields are required" validation still works

## Status

**FIXED** ✅ - Login form now correctly calls the `login` function with separate parameters.

**UPDATE:** This fix was later superseded by a more critical fix. See [SESSION_COOKIE_FIX.md](./SESSION_COOKIE_FIX.md) for the complete solution that ensures session cookies are properly set in the browser.
