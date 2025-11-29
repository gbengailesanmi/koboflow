# Settings Integration TODO

## ✅ What's Already Set Up

### Backend (Complete)
- ✅ Settings CRUD endpoints (`/api/settings`)
- ✅ PIN management endpoints (`/api/settings/pin/*`)
- ✅ Password change endpoint (`/api/settings/password/change`)
- ✅ Account deletion endpoint (`/api/settings/account`)
- ✅ AES-256-GCM PIN encryption
- ✅ PBKDF2 key derivation
- ✅ Automatic PIN re-encryption on password change

### Frontend API Layer (Complete)
- ✅ Server-side functions in `api-service.ts`
- ✅ Client-side functions in `api-client.ts`
- ✅ Type definitions
- ✅ Cache revalidation strategy

### Settings Page (Partial)
- ✅ Basic settings UI (theme, notifications, page colors)
- ✅ PIN change modal (UI only, not connected)
- ✅ Account deletion modal (connected)
- ✅ Face ID toggle (UI only)
- ❌ Password change UI (missing)
- ❌ PIN modal functionality (not connected to API)

---

## 🔧 What Needs to Be Done

### 1. Connect PIN Change Modal

**File**: `packages/web/src/app/[customerId]/settings/settings-client.tsx`

**Current State**: Modal exists but inputs don't work

**Tasks**:
- [ ] Add state for PIN inputs (currentPIN, newPIN, confirmPIN)
- [ ] Add state for password input (required for encryption)
- [ ] Add form validation
- [ ] Connect to `changeUserPIN()` API function
- [ ] Handle success/error responses
- [ ] Clear form after successful change
- [ ] Show loading state during API call

**Example Implementation**:
```typescript
const [pinForm, setPinForm] = useState({
  currentPIN: '',
  newPIN: '',
  confirmPIN: '',
  password: '',
})
const [isChangingPIN, setIsChangingPIN] = useState(false)

const handleChangePIN = async () => {
  // Validate
  if (pinForm.newPIN !== pinForm.confirmPIN) {
    showToast('PINs do not match', 'error')
    return
  }
  
  if (!/^\d{4,6}$/.test(pinForm.newPIN)) {
    showToast('PIN must be 4-6 digits', 'error')
    return
  }
  
  setIsChangingPIN(true)
  try {
    const result = await changeUserPIN(
      pinForm.currentPIN,
      pinForm.newPIN,
      pinForm.password
    )
    
    if (result.success) {
      showToast('PIN changed successfully', 'success')
      setShowPinModal(false)
      setPinForm({ currentPIN: '', newPIN: '', confirmPIN: '', password: '' })
      router.refresh()
    } else {
      showToast(result.message || 'Failed to change PIN', 'error')
    }
  } catch (error) {
    showToast('Network error', 'error')
  } finally {
    setIsChangingPIN(false)
  }
}
```

---

### 2. Add Password Change UI

**File**: `packages/web/src/app/[customerId]/settings/settings-client.tsx`

**Current State**: No UI exists for password changes

**Tasks**:
- [ ] Add "Change Password" button in Security section
- [ ] Create password change modal
- [ ] Add form inputs (current password, new password, confirm)
- [ ] Add password strength indicator
- [ ] Connect to `changeUserPassword()` API function
- [ ] Handle success/error responses
- [ ] Show info that PIN will be re-encrypted automatically

**UI Location**: Add after "Change PIN" in Security section

```tsx
<div className={styles.settingItem}>
  <div className={styles.settingInfo}>
    <Text as="label" size="2" weight="medium">Change Password</Text>
    <Text size="2" color="gray">Update your account password</Text>
  </div>
  <Button 
    variant="soft"
    onClick={() => setShowPasswordModal(true)}
  >
    Change
  </Button>
</div>
```

---

### 3. Fix Settings Type Mismatch

**Issue**: Frontend uses `pageColors` object, backend uses `appearance.pageBgColours` array

**Files to Update**:
- `packages/web/src/app/[customerId]/settings/settings-client.tsx`
- `packages/web/src/app/[customerId]/settings/page.tsx`

**Current**:
```typescript
// Frontend
pageColors: {
  analytics: '#8B7DAB',
  budget: '#86B0AA',
  // ...
}

// Backend
appearance: {
  pageBgColours: ['#color1', '#color2', ...]
}
```

**Solution Options**:

**Option A**: Update backend schema to match frontend
```typescript
// In shared/src/types/settings.ts
appearance: {
  theme: 'light' | 'dark' | 'system'
  pageColors: {
    analytics: string
    budget: string
    profile: string
    settings: string
    transactions: string
    dashboard: string
  }
  reducedMotion: boolean
}
```

**Option B**: Update frontend to match backend
```typescript
// Convert object to array before sending
const pageBgColours = Object.values(pageColors)
await updateAppSettings({ appearance: { pageBgColours } })
```

**Recommendation**: Option A (update backend) - more intuitive and type-safe

---

### 4. Consolidate Notifications Structure

**Issue**: Duplicate/confusing notifications vs alerts structure

**Current Schema**:
```typescript
notifications: {
  email: boolean
  budgetAlerts: boolean
  // ...
}
alerts: {
  weeklyReports: boolean
  monthlyReports: boolean
  transactionUpdates: boolean
  budgetAlerts: boolean  // Duplicate!
}
```

**Recommendation**: Merge into single structure
```typescript
notifications: {
  email: {
    enabled: boolean
    budgetAlerts: boolean
    transactionAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
  }
  push: {
    enabled: boolean
    budgetAlerts: boolean
    transactionAlerts: boolean
  }
  phone?: {
    number: string
    enabled: boolean
    budgetAlerts: boolean
  }
}
```

---

### 5. Add PIN Setup Flow (First Time)

**File**: Create `packages/web/src/app/[customerId]/settings/components/pin-setup-modal.tsx`

**Tasks**:
- [ ] Check if PIN is already set (use settings.security.pinHash)
- [ ] Show different modal for first-time setup vs. change
- [ ] For first-time: Only ask for new PIN + password
- [ ] Connect to `setUserPIN()` API function
- [ ] Show success message with security tips

---

### 6. Implement Face ID/Biometric

**Current**: Just a toggle with no functionality

**Tasks**:
- [ ] Research Next.js Web Authentication API
- [ ] Add WebAuthn registration flow
- [ ] Store credential ID in settings.security
- [ ] Implement biometric verification
- [ ] Fall back to PIN if biometric fails
- [ ] Handle browser compatibility

**Note**: This is a larger feature, consider as Phase 2

---

### 7. Add Settings Validation

**File**: Create `packages/web/src/app/[customerId]/settings/utils/validation.ts`

**Tasks**:
- [ ] PIN format validation (4-6 digits)
- [ ] Password strength validation (min 8 chars, complexity)
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Color hex validation

---

### 8. Add Loading States

**Files**: Various settings components

**Tasks**:
- [ ] Add skeleton loaders for initial settings fetch
- [ ] Add button loading states during save
- [ ] Add optimistic UI updates where appropriate
- [ ] Add error boundaries

---

### 9. Add Settings Success/Error Toast

**Current**: Toast exists but not consistently used

**Tasks**:
- [ ] Show toast on all successful saves
- [ ] Show descriptive error messages
- [ ] Add toast for PIN change success
- [ ] Add toast for password change success
- [ ] Add toast for settings sync

---

### 10. Testing

**Unit Tests**:
- [ ] Test PIN encryption/decryption
- [ ] Test password validation
- [ ] Test settings update flattening

**Integration Tests**:
- [ ] Test PIN change flow
- [ ] Test password change flow
- [ ] Test settings CRUD operations
- [ ] Test account deletion

**E2E Tests**:
- [ ] Test complete settings workflow
- [ ] Test PIN setup and change
- [ ] Test password change with PIN re-encryption

---

## Priority Order

### 🔴 High Priority (MVP)
1. Connect PIN Change Modal
2. Fix Settings Type Mismatch
3. Add Password Change UI
4. Add Settings Validation

### 🟡 Medium Priority (Post-MVP)
5. Add PIN Setup Flow
6. Consolidate Notifications Structure
7. Add Loading States
8. Add Success/Error Toasts

### 🟢 Low Priority (Future)
9. Implement Face ID/Biometric
10. Comprehensive Testing

---

## Quick Start

### To test PIN change functionality immediately:

1. **Update the PIN modal inputs in `settings-client.tsx`**:
```bash
# Add state and handlers as shown in section 1 above
```

2. **Test the flow**:
```bash
# Start backend and frontend
cd packages/backend && npm run dev &
cd packages/web && npm run dev
```

3. **Manual test**:
- Navigate to Settings
- Click "Change PIN"
- Enter current PIN: `1234` (if set)
- Enter new PIN: `5678`
- Enter password: Your account password
- Click "Update PIN"
- Should see success toast and modal close

---

## Questions to Resolve

1. **Should we require password for PIN verification every time?**
   - Pro: More secure
   - Con: Annoying UX
   - Recommendation: Only require on sensitive operations

2. **Should we auto-lock after X failed PIN attempts?**
   - Recommendation: Yes, implement rate limiting

3. **Should settings be real-time synced across devices?**
   - Recommendation: Add WebSocket support in Phase 2

4. **Should we allow PIN-only authentication?**
   - Recommendation: No, always require password for critical operations

---

## Resources

- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [AES-GCM Encryption](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options)
