'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { settingsUpdateAction } from '@/app/actions/settings.actions'
import { securityChangePINAction, securityChangePasswordAction } from '@/app/actions/security.actions'
import { logoutAction } from '@/app/actions/session.actions'
import { deleteUserAction } from '@/app/actions/user.actions'
import { usePageTitle } from '@/providers/header-footer-provider'
import { 
  Box,
  Button, 
  Switch, 
  Text,
  Flex,
} from '@radix-ui/themes'
import { 
  PersonIcon, 
  LockClosedIcon, 
  BellIcon, 
  QuestionMarkCircledIcon, 
  InfoCircledIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  Link2Icon,
} from '@radix-ui/react-icons'
import styles from './settings.module.css'
import type { UserSettings } from '@koboflow/shared'

type Theme = 'light' | 'dark' | 'system'

type SettingItemBase = {
  icon: React.ReactNode
  label: string
  description: string
}

type ClickableSettingItem = SettingItemBase & {
  toggle?: never
  checked?: never
  onChange?: never
  onClick: () => void
}

type ToggleSettingItem = SettingItemBase & {
  toggle: true
  checked: boolean
  onChange: (checked: boolean) => void | Promise<void>
  onClick?: never
}

type SettingItem = ClickableSettingItem | ToggleSettingItem

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
  const { setPageTitle } = usePageTitle()
  const { theme: currentTheme, setTheme: setNextTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setPageTitle('Settings', 'Manage your account preferences')
  }, [])

  const [isDarkMode, setIsDarkMode] = useState(false)
  const userName = `${firstName} ${lastName}` || ''

  useEffect(() => {
    setIsDarkMode(resolvedTheme === 'dark')
  }, [resolvedTheme])

  const handleThemeToggle = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light'
    setIsDarkMode(checked)
    setNextTheme(newTheme)
    
    try {
      await settingsUpdateAction({
        appearance: { theme: newTheme }
      } as Partial<UserSettings>)
    } catch (error) {
      // Error handled
    }
  }

  const handleLogout = async () => {
    await logoutAction()
    await signOut({
      callbackUrl: '/login',
    })
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all data. This action cannot be undone.'
    )

    if (!confirmed) return

    const result = await deleteUserAction()

    if (result.success) {
      await signOut({ callbackUrl: '/login' })
    } else {
      alert(result.message || 'Failed to delete account')
    }
  }

  const settingsSections = [
    {
      title: 'Your Profile',
      items: [
        {
          icon: <PersonIcon />,
          label: 'Personal Details',
          description: 'View your personal information',
          onClick: () => router.push(`/${customerId}/settings/personal-details`),
        },
        {
          icon: <Link2Icon />,
          label: 'Manage Accounts',
          description: 'Link and manage your bank accounts',
          onClick: () => router.push(`/${customerId}/settings/manage-accounts`),
        },
        {
          icon: <Link2Icon />,
          label: 'Reconnect Accounts',
          description: 'Refresh your account connections',
          onClick: () => router.push(`/${customerId}/settings/reconnect-accounts`),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: isDarkMode ? <MoonIcon /> : <SunIcon />,
          label: 'Dark Mode',
          description: 'Toggle dark mode on or off',
          toggle: true,
          checked: isDarkMode,
          onChange: handleThemeToggle,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: <LockClosedIcon />,
          label: 'Change PIN',
          description: 'Update your security PIN',
          onClick: () => alert('Change PIN functionality coming soon'),
        },
        {
          icon: <LockClosedIcon />,
          label: 'Use Face ID',
          description: 'Enable biometric authentication',
          onClick: () => alert('Face ID functionality coming soon'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: <BellIcon />,
          label: 'Manage Notifications',
          description: 'Control your notification preferences',
          onClick: () => router.push(`/${customerId}/settings/manage-notifications`),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <QuestionMarkCircledIcon />,
          label: 'Help & Support',
          description: 'Get help with Koboflow',
          onClick: () => alert('Support page coming soon'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: <InfoCircledIcon />,
          label: 'Terms & Conditions',
          description: 'Read our terms of service',
          onClick: () => alert('Terms & Conditions coming soon'),
        },
        {
          icon: <InfoCircledIcon />,
          label: 'Privacy Policy',
          description: 'Learn how we protect your data',
          onClick: () => alert('Privacy Policy coming soon'),
        },
        {
          icon: <InfoCircledIcon />,
          label: 'About Koboflow',
          description: 'Learn more about our app',
          onClick: () => alert('About page coming soon'),
        },
      ],
    },
  ]

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* User Profile Card */}
        <Box className={styles.profileCard}>
            <div className={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <Text size="4" weight="bold">{userName}</Text>
              <Text size="2" color="gray">{email}</Text>
            </div>
          </Box>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={styles.section}>
              <Text size="2" weight="medium" color="gray" mb="2" className={styles.sectionTitle}>
                {section.title}
              </Text>
              <Box className={styles.settingsCard}>
                {section.items.map((item, itemIndex) => {
                  const isToggleItem = 'toggle' in item && item.toggle === true
                  
                  return (
                    <div key={itemIndex}>
                      {isToggleItem ? (
                        <Flex
                          justify="between"
                          align="center"
                          className={styles.settingItem}
                        >
                          <Flex align="center" gap="3">
                            <div className={styles.settingIcon}>{item.icon}</div>
                            <Flex direction="column" gap="1">
                              <Text size="3" weight="medium">{item.label}</Text>
                              <Text size="2" color="gray">{item.description}</Text>
                            </Flex>
                          </Flex>
                          <Switch
                            checked={'checked' in item ? item.checked : false}
                            onCheckedChange={'onChange' in item ? item.onChange : undefined}
                            size="2"
                          />
                        </Flex>
                      ) : (
                        <button
                          onClick={'onClick' in item ? item.onClick : undefined}
                          className={styles.settingButton}
                        >
                          <Flex align="center" gap="3" style={{ flex: 1 }}>
                            <div className={styles.settingIcon}>{item.icon}</div>
                            <Flex direction="column" gap="1" style={{ flex: 1, textAlign: 'left' }}>
                              <Text size="3" weight="medium">{item.label}</Text>
                              <Text size="2" color="gray">{item.description}</Text>
                            </Flex>
                          </Flex>
                          <ChevronRightIcon width="18" height="18" />
                        </button>
                      )}
                      {itemIndex < section.items.length - 1 && (
                        <div className={styles.divider} />
                      )}
                    </div>
                  )
                })}
              </Box>
            </div>
          ))}

          {/* Account Actions */}
          <div className={styles.section}>
            <div className={styles.dangerZone}>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteAccount}
              >
                🗑️ Delete account
              </button>

              <button
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        </main>
      </div>
  )
}
