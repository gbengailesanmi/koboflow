'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header/page-header'
import { useBaseColor } from '@/providers/base-colour-provider'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
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

type UserPreferences = {
  theme: Theme
  accentColor: string
  notifications: NotificationSettings
  security: SecuritySettings
}

type Props = {
  customerId: string
  userName: string
  userEmail: string
  preferences: UserPreferences
}

export default function SettingsPageClient({ customerId, userName, userEmail, preferences }: Props) {
  const router = useRouter()
  const { setBaseColor } = useBaseColor()
  const [theme, setTheme] = useState<Theme>(preferences.theme)
  const [accentColor, setAccentColor] = useState(preferences.accentColor)
  const [notifications, setNotifications] = useState(preferences.notifications)
  const [useFaceId, setUseFaceId] = useState(preferences.security.useFaceId)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Set static indigo color for settings page
  useEffect(() => {
    setBaseColor(PAGE_COLORS.settings)
  }, [setBaseColor])

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
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          theme,
          accentColor,
          notifications,
          useFaceId
        })
      })

      if (response.ok) {
        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.style.setProperty('--accent-color', accentColors.find(c => c.value === accentColor)?.color || '#3b82f6')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/session', { method: 'DELETE' })
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      })

      if (response.ok) {
        router.push('/signup')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  return (
    <div className={`${styles.container} page-gradient-background`}>
      <div className={styles.wrapper}>
        <PageHeader 
          title="Settings" 
          subtitle="Manage your account preferences"
          backTo={`/${customerId}/dashboard`}
        />

        {/* User Info Section */}
        <div className={styles.section}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>{userName}</h2>
              <p className={styles.userEmail}>{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎨</span>
            Appearance
          </h3>
          
          {/* Theme Selection */}
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Theme</label>
              <p className={styles.settingDescription}>Choose your preferred color scheme</p>
            </div>
            <div className={styles.themeOptions}>
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.themeButton} ${theme === t ? styles.themeButtonActive : ''}`}
                  onClick={() => {
                    setTheme(t)
                    savePreferences()
                  }}
                >
                  <span className={styles.themeIcon}>
                    {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                  </span>
                  <span className={styles.themeLabel}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Accent Color</label>
              <p className={styles.settingDescription}>Customize your page colors</p>
            </div>
            <div className={styles.colorGrid}>
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  className={`${styles.colorOption} ${accentColor === color.value ? styles.colorOptionActive : ''}`}
                  style={{ backgroundColor: color.color }}
                  onClick={() => {
                    setAccentColor(color.value)
                    savePreferences()
                  }}
                  title={color.name}
                >
                  {accentColor === color.value && <span className={styles.colorCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔔</span>
            Notifications
          </h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Budget Alerts</label>
              <p className={styles.settingDescription}>Get notified when approaching budget limits</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={notifications.budgetAlerts}
                onChange={(e) => {
                  setNotifications({ ...notifications, budgetAlerts: e.target.checked })
                  savePreferences()
                }}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Transaction Updates</label>
              <p className={styles.settingDescription}>Receive alerts for new transactions</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={notifications.transactionUpdates}
                onChange={(e) => {
                  setNotifications({ ...notifications, transactionUpdates: e.target.checked })
                  savePreferences()
                }}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Weekly Reports</label>
              <p className={styles.settingDescription}>Summary of your weekly spending</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={notifications.weeklyReports}
                onChange={(e) => {
                  setNotifications({ ...notifications, weeklyReports: e.target.checked })
                  savePreferences()
                }}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Monthly Reports</label>
              <p className={styles.settingDescription}>Detailed monthly financial overview</p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={notifications.monthlyReports}
                onChange={(e) => {
                  setNotifications({ ...notifications, monthlyReports: e.target.checked })
                  savePreferences()
                }}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔒</span>
            Security
          </h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Change PIN</label>
              <p className={styles.settingDescription}>Update your security PIN</p>
            </div>
            <button 
              className={styles.actionButton}
              onClick={() => setShowPinModal(true)}
            >
              Change
            </button>
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
        <div className={styles.section}>
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
        <div className={styles.section}>
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
        <div className={styles.section}>
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
      </div>
    </div>
  )
}
