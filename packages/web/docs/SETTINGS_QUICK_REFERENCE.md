# Settings API - Quick Reference

## 🎯 Import Statements

```typescript
// Server Components / Server Actions
import { 
  getSettings, 
  updateSettings,
  setUserPIN,
  changeUserPIN,
  verifyUserPIN,
  changeUserPassword,
  deleteAccount
} from '@/app/api/api-service'

// Client Components
import { 
  updateAppSettings,
  setUserPIN,
  changeUserPIN,
  verifyUserPIN,
  changeUserPassword,
  deleteUserAccount,
  getSettingsClient
} from '@/app/api/api-client'
```

---

## 🔑 Common Operations

### Get Settings
```typescript
// Server-side (cached)
const settings = await getSettings()

// Client-side (fresh)
const settings = await getSettingsClient()
```

### Update Settings
```typescript
// Server-side
await updateSettings({
  appearance: { theme: 'dark' },
  notifications: { email: { budgetAlerts: true } }
})

// Client-side
await updateAppSettings({
  theme: 'dark',
  accentColor: 'blue',
  pageColors: { dashboard: '#245cd4' }
})
```

### Set PIN (First Time)
```typescript
const result = await setUserPIN('1234', 'userPassword')
if (result.success) {
  // PIN set successfully
}
```

### Change PIN
```typescript
const result = await changeUserPIN('1234', '5678', 'userPassword')
if (result.success) {
  // PIN changed successfully
}
```

### Verify PIN
```typescript
const result = await verifyUserPIN('1234', 'userPassword')
if (result.valid) {
  // PIN is correct
}
```

### Change Password
```typescript
const result = await changeUserPassword(
  'currentPassword',
  'newPassword',
  'newPassword' // confirm
)
if (result.success) {
  // Password changed (PIN auto re-encrypted)
}
```

### Delete Account
```typescript
// Server-side
const result = await deleteAccount()

// Client-side
const result = await deleteUserAccount()
```

---

## ⚠️ Important Notes

1. **PIN requires password** - PIN is encrypted with user's password
2. **PIN format** - Must be 4-6 digits
3. **Password format** - Minimum 8 characters
4. **Cache refresh** - Call `router.refresh()` after mutations in client components
5. **Error handling** - All functions return `{ success: boolean, message?: string }`

---

## 🎨 Settings Structure

```typescript
{
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
    pinHash?: string  // Encrypted
    givePermission: boolean
  }
  privacy: {
    showBalance: boolean
  }
}
```

---

## 🔒 Security Best Practices

✅ **DO:**
- Always validate PIN format (4-6 digits)
- Use password strength indicators
- Clear sensitive data from state after use
- Show loading states during API calls
- Handle errors gracefully

❌ **DON'T:**
- Store decrypted PIN in state
- Log passwords/PINs to console
- Skip error handling
- Allow weak passwords
- Cache sensitive operations

---

## 📚 Full Documentation

See `/packages/web/docs/SETTINGS_API.md` for complete documentation with examples.
