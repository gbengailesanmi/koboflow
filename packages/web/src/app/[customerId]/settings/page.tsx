'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { SettingsSkeleton } from '@/app/components/skeletons/settings-skeleton'
import { PageHeader } from '@/app/components/page-header/page-header'
import Footer from '@/app/components/footer/footer'
import { useBaseColor } from '@/providers/base-colour-provider'
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
import styles from './settings.module.css'

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

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const { setBaseColor } = useBaseColor()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [theme, setTheme] = useState<Theme>('system')
  const [accentColor, setAccentColor] = useState('blue')
  const [notifications, setNotifications] = useState<NotificationSettings>({
    budgetAlerts: true,
    transactionUpdates: true,
    weeklyReports: false,
    monthlyReports: false,
  })
  const [useFaceId, setUseFaceId] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAccentColorsExpanded, setIsAccentColorsExpanded] = useState(false)
  const [pageColors, setPageColors] = useState<AccentColours>({
    analytics: PAGE_COLORS.analytics,
    budget: PAGE_COLORS.budget,
    profile: PAGE_COLORS.profile,
    settings: PAGE_COLORS.settings,
    transactions: PAGE_COLORS.transactions,
    dashboard: PAGE_COLORS.dashboard,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes: any = await apiClient.getSession()
        if (!sessionRes.success || sessionRes.user.customerId !== customerId) {
          router.push('/login')
          return
        }

        const settingsRes: any = await apiClient.getSettings()

        const profile = {
          customerId: sessionRes.user.customerId,
          email: sessionRes.user.email,
          firstName: sessionRes.user.firstName,
          lastName: sessionRes.user.lastName,
          currency: sessionRes.user.currency,
        }

        const settings = settingsRes.settings || {}

        setData({ profile, settings })
        setTheme(settings.theme || 'system')
        setAccentColor(settings.accentColor || 'blue')
        setNotifications(settings.notifications?.email || {
          budgetAlerts: true,
          transactionUpdates: true,
          weeklyReports: false,
          monthlyReports: false,
        })
        setUseFaceId(settings.security?.useFaceId || false)
        setPageColors(settings.pageColors || {
          analytics: PAGE_COLORS.analytics,
          budget: PAGE_COLORS.budget,
          profile: PAGE_COLORS.profile,
          settings: PAGE_COLORS.settings,
          transactions: PAGE_COLORS.transactions,
          dashboard: PAGE_COLORS.dashboard,
        })
      } catch (error) {
        console.error('Failed to load settings data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, router])

  useEffect(() => {
    if (data?.settings?.pageColors?.settings) {
      const colorWithTransparency = `${data.settings.pageColors.settings}4D`
      setBaseColor(colorWithTransparency)
    }
  }, [data, setBaseColor])

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
    } catch (error) {
      console.error('Logout failed:', error)
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

  if (loading || !data) {
    return <SettingsSkeleton customerId={customerId} />
  }

  const userName = `${data.profile.firstName} ${data.profile.lastName}` || ''
  const userEmail = data.profile.email || ''

  return (
    <Sidebar customerId={customerId}>
      <>
        <div className={`${styles.container} page-gradient-background`}>
          <main className={styles.main}>
            <PageHeader 
              title="Settings" 
              subtitle="Manage your account preferences"
              backTo={`/${customerId}/dashboard`}
            />

            {/* User Profile */}
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

              {/* Accent Colors */}
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

                {isAccentColorsExpanded && (
                  <div className={styles.dropdownContent}>
                    {['analytics', 'budget', 'transactions', 'profile', 'settings', 'dashboard'].map((page) => (
                      <div key={page} className={styles.pageColorItem}>
                        <div className={styles.pageColorLabel}>
                          <div 
                            className={styles.pageColorDot}
                            style={{ backgroundColor: `${pageColors[page as keyof AccentColours]}80` }}
                          />
                          <span className={styles.pageColorName}>{page.charAt(0).toUpperCase() + page.slice(1)}</span>
                        </div>
                        <input
                          type="text"
                          value={pageColors[page as keyof AccentColours]}
                          onChange={(e) => {
                            const value = e.target.value
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                              setPageColors({ ...pageColors, [page]: value })
                            }
                          }}
                          onBlur={() => savePreferences()}
                          className={styles.hexInput}
                          placeholder={PAGE_COLORS[page as keyof typeof PAGE_COLORS]}
                          maxLength={7}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Grid>

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

            {/* Security */}
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
    </Sidebar>
  )
}
