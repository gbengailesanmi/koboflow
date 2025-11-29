# Settings API Documentation

## Overview

Complete API integration for settings management, including PIN security and password management.

---

## Architecture

```
Frontend Components
    ↓
api-client.ts (Client-side) / api-service.ts (Server-side)
    ↓
Backend API Routes (/api/settings/*)
    ↓
Services Layer
    ↓
MongoDB
```

---

## API Functions

### 📦 Server-Side Functions (`api-service.ts`)

Use these in **Server Components** and **Server Actions** only.

#### Settings

```typescript
// Get user settings (cached)
getSettings(): Promise<Settings | null>

// Update settings (revalidates cache)
updateSettings(settings: Partial<Settings>): Promise<{
  success: boolean
  message?: string
  settings?: Settings
}>

// Delete account and all data
deleteAccount(): Promise<{
  success: boolean
  message?: string
}>
```

#### PIN Management

```typescript
// Set new PIN (first-time setup)
setUserPIN(pin: string, password: string): Promise<{
  success: boolean
  message?: string
}>

// Change existing PIN
changeUserPIN(
  oldPin: string,
  newPin: string,
  password: string
): Promise<{
  success: boolean
  message?: string
}>

// Verify PIN
verifyUserPIN(pin: string, password: string): Promise<{
  success: boolean
  valid?: boolean
  message?: string
}>
```

#### Password Management

```typescript
// Change password (re-encrypts PIN automatically)
changeUserPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{
  success: boolean
  message?: string
}>
```

---

### 🌐 Client-Side Functions (`api-client.ts`)

Use these in **Client Components** with `'use client'` directive.

#### Settings

```typescript
// Update app settings
updateAppSettings(data: any): Promise<any>

// Delete account
deleteUserAccount(): Promise<any>

// Get fresh settings (not cached)
getSettingsClient(): Promise<any>
```

#### PIN Management

```typescript
// Set new PIN
setUserPIN(pin: string, password: string): Promise<any>

// Change PIN
changeUserPIN(oldPin: string, newPin: string, password: string): Promise<any>

// Verify PIN
verifyUserPIN(pin: string, password: string): Promise<any>
```

#### Password Management

```typescript
// Change password
changeUserPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<any>
```

---

## Backend Endpoints

### GET `/api/settings`
- **Auth**: Required
- **Returns**: User settings
- **Cache**: Tags `['settings']`

### PATCH `/api/settings`
- **Auth**: Required
- **Body**: `Partial<UserSettings>`
- **Returns**: Updated settings
- **Revalidates**: `settings`, `session`

### DELETE `/api/settings/account`
- **Auth**: Required
- **Returns**: Success message
- **Deletes**: User, accounts, transactions, budgets, categories, settings

---

### POST `/api/settings/pin/set`
- **Auth**: Required
- **Body**: `{ pin: string, password: string }`
- **Returns**: Success message
- **Validation**: PIN must be 4-6 digits

### POST `/api/settings/pin/change`
- **Auth**: Required
- **Body**: `{ oldPin: string, newPin: string, password: string }`
- **Returns**: Success message
- **Validation**: Verifies old PIN, new PIN must be 4-6 digits

### POST `/api/settings/pin/verify`
- **Auth**: Required
- **Body**: `{ pin: string, password: string }`
- **Returns**: `{ success: boolean, valid: boolean }`

---

### POST `/api/settings/password/change`
- **Auth**: Required
- **Body**: `{ currentPassword: string, newPassword: string, confirmPassword: string }`
- **Returns**: Success message
- **Side Effect**: Re-encrypts PIN with new password if PIN is set
- **Validation**: New password must be at least 8 characters

---

## Security Features

### PIN Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Storage Format**: `salt:iv:authTag:encryptedData` (base64)
- **Encryption Key**: Derived from user's password

**Why?** PIN is encrypted with the user's password, so it can only be decrypted when the user provides their password.

### Password Changes
When a user changes their password:
1. Verify current password
2. Hash new password
3. **Automatically re-encrypt PIN** with new password
4. Update both in database atomically

This ensures PIN remains accessible after password changes.

---

## Usage Examples

### Server Component (Settings Page)

```typescript
// app/[customerId]/settings/page.tsx
import { getSession, getSettings } from '@/app/api/api-service'

export default async function SettingsPage() {
  const [session, settings] = await Promise.all([
    getSession(),
    getSettings(),
  ])

  return <SettingsClient initialSettings={settings} />
}
```

### Client Component (PIN Change)

```typescript
'use client'
import { changeUserPIN } from '@/app/api/api-client'
import { useRouter } from 'next/navigation'

function ChangePINModal() {
  const router = useRouter()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const result = await changeUserPIN(oldPin, newPin, password)
    
    if (result.success) {
      showToast('PIN changed successfully', 'success')
      router.refresh() // Revalidate cache
    } else {
      showToast(result.message || 'Failed to change PIN', 'error')
    }
  }
  
  // ... form JSX
}
```

### Server Action (Password Change)

```typescript
'use server'
import { changeUserPassword } from '@/app/api/api-service'
import { redirect } from 'next/navigation'

export async function handlePasswordChange(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  const result = await changeUserPassword(
    currentPassword,
    newPassword,
    confirmPassword
  )
  
  if (result.success) {
    redirect('/settings?success=password-changed')
  }
  
  return result
}
```

---

## Data Models

### UserSettings Type

```typescript
interface UserSettings {
  customerId: string
  dateFormat: string
  appearance: {
    theme: 'light' | 'dark' | 'system'
    pageBgColours: string[]
    reducedMotion: boolean
  }
  notifications: {
    email: boolean
    budgetAlerts: boolean
    phone?: string
    phoneNotifications: boolean
  }
  alerts: {
    weeklyReports: boolean
    monthlyReports: boolean
    transactionUpdates: boolean
    budgetAlerts: boolean
  }
  currency: string
  security: {
    faceId: boolean
    pinHash?: string  // Encrypted PIN
    givePermission: boolean
  }
  privacy: {
    showBalance: boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

---

## Cache Strategy

All settings operations use Next.js cache tags:

- **`settings`** - Settings data
- **`session`** - User session (includes settings metadata)

**Revalidation triggers:**
- `PATCH /api/settings` → Revalidates `settings`, `session`
- `POST /api/settings/pin/*` → Revalidates `settings`
- `POST /api/settings/password/change` → Revalidates `settings`, `session`

---

## Error Handling

All API functions follow consistent error patterns:

```typescript
{
  success: boolean
  message?: string
  // ... additional fields
}
```

**Client-side:**
```typescript
try {
  const result = await setUserPIN(pin, password)
  if (!result.success) {
    showToast(result.message || 'Operation failed', 'error')
  }
} catch (error) {
  console.error('API call failed:', error)
  showToast('Network error', 'error')
}
```

**Server-side:**
```typescript
const result = await changeUserPassword(curr, newPass, confirm)
if (!result.success) {
  return { error: result.message }
}
```

---

## Testing Checklist

- [ ] Get settings on page load
- [ ] Update theme settings
- [ ] Update notification preferences
- [ ] Set PIN for first time
- [ ] Change existing PIN
- [ ] Verify PIN (correct & incorrect)
- [ ] Change password (without PIN set)
- [ ] Change password (with PIN set - verify PIN still works)
- [ ] Delete account
- [ ] Handle network errors
- [ ] Handle validation errors
- [ ] Cache revalidation works

---

## Related Files

- **Backend Routes**: `packages/backend/src/routes/settings.ts`
- **Backend Services**: `packages/backend/src/services/settings.ts`
- **PIN Security**: `packages/backend/src/services/pin-security.ts`
- **Types**: `packages/shared/src/types/settings.ts`
- **Frontend API**: `packages/web/src/app/api/api-service.ts`
- **Frontend API**: `packages/web/src/app/api/api-client.ts`

---

## Notes

1. **Password is required for PIN operations** because the PIN is encrypted with the password
2. **PIN format**: Must be 4-6 digits
3. **Password format**: Minimum 8 characters
4. **Delete account**: Cascading delete removes all user data
5. **Settings auto-create**: If settings don't exist, they're created with defaults

---

## Future Enhancements

- [ ] Biometric authentication (Face ID/Touch ID)
- [ ] PIN timeout after failed attempts
- [ ] 2FA support
- [ ] Settings export/import
- [ ] Audit log for security changes
