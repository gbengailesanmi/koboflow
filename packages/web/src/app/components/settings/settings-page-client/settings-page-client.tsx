'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header/page-header'
import Footer from '@/app/components/footer/footer'
import { useBaseColor } from '@/providers/base-colour-provider'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { apiClient } from '@/lib/api-client'
import { 
  Grid, 
  Card, 
  Badge, 
  Button, 
  Switch, 
  TextField, 
  RadioCards, 
  Separator, 
  Dialog,
  Heading,
  Text,
  Flex,
  Box,
  Avatar
} from '@radix-ui/themes'
import styles from './settings-page-client.module.css'

type Theme = 'light' | 'dark' | 'system'

type NotificationSettings = {
  budgetAlerts: boolean
  transactionUpdates: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

type SecuritySettings = {
  useFaceId: boolean
}

type AccentColours = {
  analytics: string
  budget: string
  profile: string
  settings: string
  transactions: string
  dashboard: string
}

type UserPreferences = {
  theme: Theme
  accentColor: string
  notifications: NotificationSettings
  security: SecuritySettings
  pageColors?: AccentColours
}

type Props = {
  customerId: string
  userName: string
  userEmail: string
  pageColor: string
  preferences: UserPreferences
}

export default function SettingsPageClient({ customerId, userName, userEmail, pageColor, preferences }: Props) {
  const router = useRouter()
  const { setBaseColor } = useBaseColor()
  const [theme, setTheme] = useState<Theme>(preferences.theme)
  const [accentColor, setAccentColor] = useState(preferences.accentColor)
  const [notifications, setNotifications] = useState(preferences.notifications)
  const [useFaceId, setUseFaceId] = useState(preferences.security.useFaceId)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAccentColorsExpanded, setIsAccentColorsExpanded] = useState(false)
  
  const [pageColors, setPageColors] = useState<AccentColours>(
    preferences.pageColors || {
      analytics: PAGE_COLORS.analytics,
      budget: PAGE_COLORS.budget,
      profile: PAGE_COLORS.profile,
      settings: PAGE_COLORS.settings,
      transactions: PAGE_COLORS.transactions,
      dashboard: PAGE_COLORS.dashboard,
    }
  )

  // Set page color with 30% transparency
  useEffect(() => {
    const colorWithTransparency = `${pageColor}4D` // 30% transparency
    setBaseColor(colorWithTransparency)
  }, [pageColor, setBaseColor])

  const accentColors = [
    { name: 'Blue', value: 'blue', color: '#3b82f6' },
    { name: 'Purple', value: 'purple', color: '#a855f7' },
    { name: 'Green', value: 'green', color: '#10b981' },
    { name: 'Orange', value: 'orange', color: '#f97316' },
    { name: 'Pink', value: 'pink', color: '#ec4899' },
    { name: 'Red', value: 'red', color: '#ef4444' },
    { name: 'Teal', value: 'teal', color: '#14b8a6' },
    { name: 'Indigo', value: 'indigo', color: '#6366f1' },
  ]

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      await apiClient.updateSettings({
        customerId,
        theme,
        accentColor,
        notifications: {
          email: notifications
        },
        pageColors
      })

      // Apply theme immediately
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.setProperty('--accent-color', accentColors.find(c => c.value === accentColor)?.color || '#3b82f6')
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiClient.logout()
      // apiClient.logout() already redirects to /login
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if the API call fails
      router.push('/login')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await apiClient.deleteAccount(customerId)
      router.push('/signup')
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  return (
    <>
      <div className={`${styles.container} page-gradient-background`}>
        <main className={styles.main}>
          <PageHeader 
            title="Settings" 
            subtitle="Manage your account preferences"
            backTo={`/${customerId}/dashboard`}
          />

          {/* User Info Section */}
          <Grid id="user-profile" className={styles.settingsCard}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>{userName}</h2>
              <p className={styles.userEmail}>{userEmail}</p>
            </div>
          </div>
        </Grid>

        {/* Appearance Section */}
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
                setTheme(value as Theme)
                savePreferences()
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

          {/* Accent Colours - Collapsible Dropdown */}
          <div className={styles.settingItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button 
              className={styles.dropdownHeader}
              onClick={() => setIsAccentColorsExpanded(!isAccentColorsExpanded)}
            >
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Accent Colours</label>
                <p className={styles.settingDescription}>Customize page colors</p>
              </div>
              <span className={`${styles.dropdownArrow} ${isAccentColorsExpanded ? styles.dropdownArrowOpen : ''}`}>
                ▼
              </span>
            </button>

            {/* Collapsible Page Color List */}
            {isAccentColorsExpanded && (
              <div className={styles.dropdownContent}>
                {/* Analytics */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.analytics}80` }}
                    />
                    <span className={styles.pageColorName}>Analytics</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.analytics}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, analytics: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#8B7DAB"
                    maxLength={7}
                  />
                </div>

                {/* Budget */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.budget}80` }}
                    />
                    <span className={styles.pageColorName}>Budget</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.budget}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, budget: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#86B0AA"
                    maxLength={7}
                  />
                </div>

                {/* Transactions */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.transactions}80` }}
                    />
                    <span className={styles.pageColorName}>Transactions</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.transactions}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, transactions: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#966F83"
                    maxLength={7}
                  />
                </div>

                {/* Profile */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.profile}80` }}
                    />
                    <span className={styles.pageColorName}>Profile</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.profile}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, profile: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#f59e0b"
                    maxLength={7}
                  />
                </div>

                {/* Settings */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.settings}80` }}
                    />
                    <span className={styles.pageColorName}>Settings</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.settings}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, settings: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#7D7DBD"
                    maxLength={7}
                  />
                </div>

                {/* Dashboard */}
                <div className={styles.pageColorItem}>
                  <div className={styles.pageColorLabel}>
                    <div 
                      className={styles.pageColorDot}
                      style={{ backgroundColor: `${pageColors.dashboard}80` }}
                    />
                    <span className={styles.pageColorName}>Dashboard</span>
                  </div>
                  <input
                    type="text"
                    value={pageColors.dashboard}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPageColors({ ...pageColors, dashboard: value })
                      }
                    }}
                    onBlur={() => savePreferences()}
                    className={styles.hexInput}
                    placeholder="#245cd4"
                    maxLength={7}
                  />
                </div>
              </div>
            )}
          </div>
        </Grid>

        {/* Notifications Section */}
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
              checked={notifications.budgetAlerts}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, budgetAlerts: checked })
                savePreferences()
              }}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text as="label" size="2" weight="medium">Transaction Updates</Text>
              <Text size="2" color="gray">Receive alerts for new transactions</Text>
            </div>
            <Switch
              checked={notifications.transactionUpdates}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, transactionUpdates: checked })
                savePreferences()
              }}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text as="label" size="2" weight="medium">Weekly Reports</Text>
              <Text size="2" color="gray">Summary of your weekly spending</Text>
            </div>
            <Switch
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, weeklyReports: checked })
                savePreferences()
              }}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text as="label" size="2" weight="medium">Monthly Reports</Text>
              <Text size="2" color="gray">Detailed monthly financial overview</Text>
            </div>
            <Switch
              checked={notifications.monthlyReports}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, monthlyReports: checked })
                savePreferences()
              }}
            />
          </div>
        </div>

        {/* Security Section */}
        <div id="security" className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔒</span>
            Security
          </h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text as="label" size="2" weight="medium">Change PIN</Text>
              <Text size="2" color="gray">Update your security PIN</Text>
            </div>
            <Button 
              variant="soft"
              onClick={() => setShowPinModal(true)}
            >
              Change
            </Button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Face ID</label>
              <p className={styles.settingDescription}>Use Face ID for quick access</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={useFaceId}
                onChange={(e) => {
                  setUseFaceId(e.target.checked)
                  savePreferences()
                }}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {/* Support Section */}
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

        {/* About Section */}
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

        {/* Danger Zone */}
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
              <h3 className={styles.modalTitle}>Change PIN</h3>
              <p className={styles.modalDescription}>Enter your current PIN and new PIN</p>
              
              <div className={styles.modalForm}>
                <input
                  type="password"
                  placeholder="Current PIN"
                  className={styles.modalInput}
                  maxLength={6}
                />
                <input
                  type="password"
                  placeholder="New PIN"
                  className={styles.modalInput}
                  maxLength={6}
                />
                <input
                  type="password"
                  placeholder="Confirm New PIN"
                  className={styles.modalInput}
                  maxLength={6}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.modalCancel}
                  onClick={() => setShowPinModal(false)}
                >
                  Cancel
                </button>
                <button className={styles.modalConfirm}>
                  Update PIN
                </button>
              </div>
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
                <button 
                  className={styles.modalCancel}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.modalDelete}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
      <Footer buttonColor='#222222' opacity={50} />
    </>
  )
}
