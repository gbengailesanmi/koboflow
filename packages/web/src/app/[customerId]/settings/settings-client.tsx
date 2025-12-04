'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { updateSettingsAction } from '@/app/actions/update-settings-action'
import { changeUserPINAction } from '@/app/actions/change-user-pin-action'
import { changeUserPasswordAction } from '@/app/actions/change-user-password-action'
import { deleteAccountAction } from '@/app/actions/delete-account-action'
import { useToasts } from '@/store'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PageHeader } from '@/app/components/page-header/page-header'
import Footer from '@/app/components/footer/footer'
import { 
  Grid, 
  Button, 
  Switch, 
  RadioCards, 
  Text,
  Flex,
  TextField,
} from '@radix-ui/themes'
import styles from './settings.module.css'
import type { UserSettings } from '@money-mapper/shared'

type Theme = 'light' | 'dark' | 'system'

type SettingsClientProps = {
  customerId: string
  firstName: string
  lastName: string
  email: string
  initialSettings: UserSettings | null
}

export default function SettingsClient({
  customerId,
  firstName,
  lastName,
  email,
  initialSettings
}: SettingsClientProps) {
  const router = useRouter()
  const { showToast } = useToasts()
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme()

  // Settings state
  const [theme, setTheme] = useState<Theme>(initialSettings?.appearance?.theme || 'system')
  const [emailChannel, setEmailChannel] = useState(initialSettings?.receiveOn?.email ?? true)
  const [smsChannel, setSmsChannel] = useState(initialSettings?.receiveOn?.sms ?? false)
  const [budgetAlerts, setBudgetAlerts] = useState(initialSettings?.notifications?.budgetAlerts ?? true)
  const [weeklyBudgetReports, setWeeklyBudgetReports] = useState(initialSettings?.notifications?.weeklyBudgetReports ?? false)
  const [monthlyReports, setMonthlyReports] = useState(initialSettings?.notifications?.monthlyReports ?? false)
  const [weeklyTransactionReports, setWeeklyTransactionReports] = useState(initialSettings?.notifications?.weeklyTransactionReports ?? false)
  const [transactionAlerts, setTransactionAlerts] = useState(initialSettings?.notifications?.transactionAlerts ?? true)
  const [weeklyInsightReports, setWeeklyInsightReports] = useState(initialSettings?.notifications?.weeklyInsightReports ?? false)
  const [showBalance, setShowBalance] = useState(initialSettings?.privacy?.showBalance ?? true)
  const [faceId, setFaceId] = useState(initialSettings?.security?.faceId ?? false)
  const [givePermission, setGivePermission] = useState(initialSettings?.security?.givePermission ?? false)

  // Sync settings page theme state when next-themes changes (from hamburger menu or elsewhere)
  useEffect(() => {
    if (currentTheme && currentTheme !== 'system' && currentTheme !== theme) {
      setTheme(currentTheme as Theme)
    }
  }, [currentTheme, theme])
  
  // Modal states
  const [showPinModal, setShowPinModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // PIN form state
  const [pinForm, setPinForm] = useState({
    currentPIN: '',
    newPIN: '',
    confirmPIN: '',
    password: '',
  })
  const [isChangingPIN, setIsChangingPIN] = useState(false)
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)

  const hasPIN = !!initialSettings?.security?.pinHash

  const userName = `${firstName} ${lastName}` || ''

  const saveSettings = async (overrides?: Partial<{
    theme: Theme
    emailChannel: boolean
    smsChannel: boolean
    budgetAlerts: boolean
    weeklyBudgetReports: boolean
    monthlyReports: boolean
    weeklyTransactionReports: boolean
    transactionAlerts: boolean
    weeklyInsightReports: boolean
    showBalance: boolean
    faceId: boolean
    givePermission: boolean
  }>) => {
    setIsSaving(true)
    
    try {
      const settingsData = {
        appearance: {
          theme: overrides?.theme ?? theme,
        },
        receiveOn: {
          email: overrides?.emailChannel ?? emailChannel,
          sms: overrides?.smsChannel ?? smsChannel,
        },
        notifications: {
          budgetAlerts: overrides?.budgetAlerts ?? budgetAlerts,
          weeklyBudgetReports: overrides?.weeklyBudgetReports ?? weeklyBudgetReports,
          monthlyReports: overrides?.monthlyReports ?? monthlyReports,
          weeklyTransactionReports: overrides?.weeklyTransactionReports ?? weeklyTransactionReports,
          transactionAlerts: overrides?.transactionAlerts ?? transactionAlerts,
          weeklyInsightReports: overrides?.weeklyInsightReports ?? weeklyInsightReports,
        },
        security: {
          faceId: overrides?.faceId ?? faceId,
          givePermission: overrides?.givePermission ?? givePermission,
        },
        privacy: {
          showBalance: overrides?.showBalance ?? showBalance,
        }
      }
      
      const result = await updateSettingsAction(settingsData as any)

      if (result.success) {
        showToast('Settings saved successfully', 'success')
        router.refresh()
      } else {
        showToast(result.message || 'Failed to save settings', 'error')
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      const errorMessage = error?.message || 'Failed to save settings. Please check your connection.'
      showToast(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle PIN change
  const handleChangePIN = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!pinForm.currentPIN || !pinForm.newPIN || !pinForm.confirmPIN || !pinForm.password) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (pinForm.newPIN !== pinForm.confirmPIN) {
      showToast('New PINs do not match', 'error')
      return
    }

    if (!/^\d{4,6}$/.test(pinForm.newPIN)) {
      showToast('PIN must be 4-6 digits', 'error')
      return
    }

    setIsChangingPIN(true)
    try {
      const result = await changeUserPINAction(
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
      console.error('PIN change error:', error)
      showToast('Network error', 'error')
    } finally {
      setIsChangingPIN(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changeUserPasswordAction(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      )

      if (result.success) {
        showToast('Password changed successfully', 'success')
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        router.refresh()
      } else {
        showToast(result.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Password change error:', error)
      showToast('Network error', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccountAction()
      if (result.success) {
        showToast('Account deleted successfully', 'success')
        router.push('/signup')
      } else {
        showToast(result.message || 'Failed to delete account', 'error')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      showToast('Failed to delete account', 'error')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    router.push('/login')
  }

  return (
    <Sidebar customerId={customerId}>
      <>
        <div className={`${styles.container}`}>
          <main className={styles.main}>
            <PageHeader 
              title="Settings" 
              subtitle="Manage your account preferences"
              backTo={`/\${customerId}/dashboard`}
            />

            {/* User Profile */}
            <Grid id="user-profile" className={styles.settingsCard}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userDetails}>
                  <h2 className={styles.userName}>{userName}</h2>
                  <p className={styles.userEmail}>{email}</p>
                </div>
              </div>
            </Grid>

            {/* Appearance */}
            <Grid id="appearance" className={styles.settingsCard}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🎨</span>
                Appearance
              </h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Theme</Text>
                  <Text size="2" color="gray">Choose your preferred color scheme</Text>
                </div>
                <RadioCards.Root
                  value={theme}
                  onValueChange={(value) => {
                    const newTheme = value as Theme
                    setTheme(newTheme)
                    setNextTheme(newTheme)
                    saveSettings({ theme: newTheme })
                  }}
                  columns="3"
                >
                  <RadioCards.Item value="light">
                    <Flex direction="column" align="center" gap="1">
                      <Text size="3">☀️</Text>
                      <Text size="2">Light</Text>
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item value="dark">
                    <Flex direction="column" align="center" gap="1">
                      <Text size="3">🌙</Text>
                      <Text size="2">Dark</Text>
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item value="system">
                    <Flex direction="column" align="center" gap="1">
                      <Text size="3">💻</Text>
                      <Text size="2">System</Text>
                    </Flex>
                  </RadioCards.Item>
                </RadioCards.Root>
              </div>
            </Grid>

            {/* Receive On */}
            <div id="receive-on" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📮</span>
                Receive On
              </h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Email</Text>
                  <Text size="2" color="gray">Receive notifications via email</Text>
                </div>
                <Switch
                  checked={emailChannel}
                  onCheckedChange={(checked) => {
                    setEmailChannel(checked)
                    saveSettings({ emailChannel: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">SMS</Text>
                  <Text size="2" color="gray">Receive notifications via text message</Text>
                </div>
                <Switch
                  checked={smsChannel}
                  onCheckedChange={(checked) => {
                    setSmsChannel(checked)
                    saveSettings({ smsChannel: checked })
                  }}
                />
              </div>
            </div>

            {/* Notifications */}
            <div id="notifications" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔔</span>
                Notifications
              </h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Budget Alerts</Text>
                  <Text size="2" color="gray">Get notified when approaching budget limits</Text>
                </div>
                <Switch
                  checked={budgetAlerts}
                  onCheckedChange={(checked) => {
                    setBudgetAlerts(checked)
                    saveSettings({ budgetAlerts: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Weekly Budget Reports</Text>
                  <Text size="2" color="gray">Summary of your weekly budget performance</Text>
                </div>
                <Switch
                  checked={weeklyBudgetReports}
                  onCheckedChange={(checked) => {
                    setWeeklyBudgetReports(checked)
                    saveSettings({ weeklyBudgetReports: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Monthly Reports</Text>
                  <Text size="2" color="gray">Detailed monthly financial overview</Text>
                </div>
                <Switch
                  checked={monthlyReports}
                  onCheckedChange={(checked) => {
                    setMonthlyReports(checked)
                    saveSettings({ monthlyReports: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Weekly Transaction Reports</Text>
                  <Text size="2" color="gray">Summary of your weekly transactions</Text>
                </div>
                <Switch
                  checked={weeklyTransactionReports}
                  onCheckedChange={(checked) => {
                    setWeeklyTransactionReports(checked)
                    saveSettings({ weeklyTransactionReports: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Transaction Alerts</Text>
                  <Text size="2" color="gray">Receive alerts for new transactions</Text>
                </div>
                <Switch
                  checked={transactionAlerts}
                  onCheckedChange={(checked) => {
                    setTransactionAlerts(checked)
                    saveSettings({ transactionAlerts: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Weekly Insight Reports</Text>
                  <Text size="2" color="gray">Get insights and spending patterns weekly</Text>
                </div>
                <Switch
                  checked={weeklyInsightReports}
                  onCheckedChange={(checked) => {
                    setWeeklyInsightReports(checked)
                    saveSettings({ weeklyInsightReports: checked })
                  }}
                />
              </div>
            </div>

            {/* Security */}
            <div id="security" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔒</span>
                Security
              </h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">
                    {hasPIN ? 'Change PIN' : 'Set PIN'}
                  </Text>
                  <Text size="2" color="gray">
                    {hasPIN ? 'Update your security PIN' : 'Set up a 4-6 digit security PIN'}
                  </Text>
                </div>
                <Button 
                  variant="soft"
                  onClick={() => setShowPinModal(true)}
                >
                  {hasPIN ? 'Change' : 'Set Up'}
                </Button>
              </div>

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

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Face ID / Touch ID</Text>
                  <Text size="2" color="gray">Use biometric authentication for quick access</Text>
                </div>
                <Switch
                  checked={faceId}
                  onCheckedChange={(checked) => {
                    setFaceId(checked)
                    saveSettings({ faceId: checked })
                  }}
                />
              </div>
            </div>

            {/* Privacy */}
            <div id="privacy" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔐</span>
                Privacy
              </h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Show Balance</Text>
                  <Text size="2" color="gray">Display account balances on dashboard</Text>
                </div>
                <Switch
                  checked={showBalance}
                  onCheckedChange={(checked) => {
                    setShowBalance(checked)
                    saveSettings({ showBalance: checked })
                  }}
                />
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <Text as="label" size="2" weight="medium">Data Sharing Permissions</Text>
                  <Text size="2" color="gray">Allow Money Mapper to access financial data for insights</Text>
                </div>
                <Switch
                  checked={givePermission}
                  onCheckedChange={(checked) => {
                    setGivePermission(checked)
                    saveSettings({ givePermission: checked })
                  }}
                />
              </div>
            </div>

            {/* Support */}
            <div id="support" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>💬</span>
                Support
              </h3>
              
              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>Get in Touch</span>
                <span className={styles.linkArrow}>→</span>
              </button>

              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>Help Center</span>
                <span className={styles.linkArrow}>→</span>
              </button>

              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>Report a Problem</span>
                <span className={styles.linkArrow}>→</span>
              </button>
            </div>

            {/* About */}
            <div id="about-app" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>ℹ️</span>
                About
              </h3>
              
              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>Terms & Conditions</span>
                <span className={styles.linkArrow}>→</span>
              </button>

              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>Privacy Policy</span>
                <span className={styles.linkArrow}>→</span>
              </button>

              <button className={styles.linkItem}>
                <span className={styles.linkLabel}>About Money Mapper</span>
                <span className={styles.linkArrow}>→</span>
              </button>

              <div className={styles.versionInfo}>
                <span className={styles.versionLabel}>Version</span>
                <span className={styles.versionNumber}>1.0.0</span>
              </div>
            </div>

            {/* Account Actions */}
            <div id="account" className={styles.section}>
              <div className={styles.dangerZone}>
                <button 
                  className={styles.deleteButton}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <span className={styles.deleteIcon}>⚠️</span>
                  Delete Account
                </button>

                <button 
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  <span className={styles.logoutIcon}>🚪</span>
                  Log Out
                </button>
              </div>
            </div>

            {/* PIN Change Modal */}
            {showPinModal && (
              <div className={styles.modal} onClick={() => setShowPinModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>
                    {hasPIN ? 'Change PIN' : 'Set PIN'}
                  </h3>
                  <p className={styles.modalDescription}>
                    {hasPIN 
                      ? 'Enter your current PIN and new PIN' 
                      : 'Create a 4-6 digit PIN for quick access'}
                  </p>
                  
                  <form onSubmit={handleChangePIN} className={styles.modalForm}>
                    {hasPIN && (
                      <TextField.Root
                        type="password"
                        placeholder="Current PIN"
                        value={pinForm.currentPIN}
                        onChange={(e) => setPinForm({ ...pinForm, currentPIN: e.target.value })}
                        maxLength={6}
                        required
                      />
                    )}
                    <TextField.Root
                      type="password"
                      placeholder="New PIN (4-6 digits)"
                      value={pinForm.newPIN}
                      onChange={(e) => setPinForm({ ...pinForm, newPIN: e.target.value })}
                      maxLength={6}
                      required
                    />
                    <TextField.Root
                      type="password"
                      placeholder="Confirm New PIN"
                      value={pinForm.confirmPIN}
                      onChange={(e) => setPinForm({ ...pinForm, confirmPIN: e.target.value })}
                      maxLength={6}
                      required
                    />
                    <TextField.Root
                      type="password"
                      placeholder="Your Account Password"
                      value={pinForm.password}
                      onChange={(e) => setPinForm({ ...pinForm, password: e.target.value })}
                      required
                    />

                    <div className={styles.modalActions}>
                      <Button 
                        type="button"
                        variant="soft"
                        color="gray"
                        onClick={() => setShowPinModal(false)}
                        disabled={isChangingPIN}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isChangingPIN}
                      >
                        {isChangingPIN ? 'Updating...' : hasPIN ? 'Update PIN' : 'Set PIN'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>Change Password</h3>
                  <p className={styles.modalDescription}>
                    Enter your current password and new password
                    {hasPIN && ' (Your PIN will be automatically re-encrypted)'}
                  </p>
                  
                  <form onSubmit={handleChangePassword} className={styles.modalForm}>
                    <TextField.Root
                      type="password"
                      placeholder="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                    <TextField.Root
                      type="password"
                      placeholder="New Password (min 8 characters)"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                    <TextField.Root
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />

                    <div className={styles.modalActions}>
                      <Button 
                        type="button"
                        variant="soft"
                        color="gray"
                        onClick={() => setShowPasswordModal(false)}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className={styles.modal} onClick={() => setShowDeleteModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>Delete Account</h3>
                  <p className={styles.modalDescription}>
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                  
                  <div className={styles.modalWarning}>
                    <span className={styles.warningIcon}>⚠️</span>
                    <p className={styles.warningText}>
                      Are you sure you want to delete your account?
                    </p>
                  </div>

                  <div className={styles.modalActions}>
                    <Button 
                      variant="soft"
                      color="gray"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      color="red"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
        <Footer buttonColor='#222222' opacity={50} />
      </>
    </Sidebar>
  )
}
