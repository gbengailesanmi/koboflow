'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { updateSettingsAction } from '@/app/actions/update-settings-action'
import { changeUserPINAction } from '@/app/actions/change-user-pin-action'
import { changeUserPasswordAction } from '@/app/actions/change-user-password-action'
import { deleteAccountAction } from '@/app/actions/delete-account-action'
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
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme()

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

  const hasPIN = !!initialSettings?.security?.pinHash
  const userName = `${firstName} ${lastName}` || ''

  useEffect(() => {
    if (currentTheme && currentTheme !== 'system' && currentTheme !== theme) {
      setTheme(currentTheme as Theme)
    }
  }, [currentTheme, theme])

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/login',
    })
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all data. This action cannot be undone.'
    )

    if (!confirmed) return

    const result = await deleteAccountAction()

    if (result.success) {
      await signOut({ callbackUrl: '/login' })
    } else {
      alert(result.message || 'Failed to delete account')
    }
  }

  return (
    <Sidebar customerId={customerId}>
      <>
        <div className={styles.container}>
          <main className={styles.main}>
            <PageHeader 
              title="Settings" 
              subtitle="Manage your account preferences"
              backTo={`/${customerId}/dashboard`}
            />

            {/* User Profile */}
            <Grid className={styles.settingsCard}>
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
        <Footer buttonColor="#222222" opacity={50} />
      </>
    </Sidebar>
  )
}
