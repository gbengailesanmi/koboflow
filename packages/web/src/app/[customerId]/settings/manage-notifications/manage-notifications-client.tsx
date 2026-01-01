'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Text, IconButton, Switch } from '@radix-ui/themes'
import { Cross2Icon, BellIcon } from '@radix-ui/react-icons'
import type { UserSettings } from '@money-mapper/shared'
import { settingsUpdateAction } from '@/app/actions/settings.actions'
import styles from './manage-notifications.module.css'

type ManageNotificationsClientProps = {
  customerId: string
  initialSettings: UserSettings | null
}

export default function ManageNotificationsClient({
  customerId,
  initialSettings,
}: ManageNotificationsClientProps) {
  const router = useRouter()

  const [weeklySpendingSummary, setWeeklySpendingSummary] = useState(
    initialSettings?.notifications?.weeklyInsightReports ?? false
  )
  const [monthlySpendingSummary, setMonthlySpendingSummary] = useState(
    initialSettings?.notifications?.monthlyReports ?? false
  )
  const [budgetWarnings, setBudgetWarnings] = useState(
    initialSettings?.notifications?.budgetAlerts ?? true
  )
  const [newsletterEmails, setNewsletterEmails] = useState(
    initialSettings?.notifications?.weeklyBudgetReports ?? false
  )
  const [upcomingBills, setUpcomingBills] = useState(
    initialSettings?.notifications?.weeklyTransactionReports ?? false
  )
  const [moneySavingInsights, setMoneySavingInsights] = useState(
    initialSettings?.notifications?.transactionAlerts ?? true
  )

  const handleToggle = async (
    setting: string,
    value: boolean,
    setter: (value: boolean) => void
  ) => {
    setter(value)

    try {
      const updates: Partial<UserSettings> = {
        notifications: {
          budgetAlerts: initialSettings?.notifications?.budgetAlerts ?? true,
          weeklyBudgetReports: initialSettings?.notifications?.weeklyBudgetReports ?? false,
          monthlyReports: initialSettings?.notifications?.monthlyReports ?? false,
          weeklyTransactionReports: initialSettings?.notifications?.weeklyTransactionReports ?? false,
          transactionAlerts: initialSettings?.notifications?.transactionAlerts ?? true,
          weeklyInsightReports: initialSettings?.notifications?.weeklyInsightReports ?? false,
          [setting]: value,
        },
      }

      const result = await settingsUpdateAction(updates)

      if (!result.success) {
        // Revert on failure
        setter(!value)
        alert(result.message || 'Failed to update notification settings')
      }
    } catch (error) {
      // Revert on error
      setter(!value)
      alert('Failed to update notification settings')
    }
  }

  const handleClose = () => {
    router.push(`/${customerId}/settings`)
  }

  const notificationSettings = [
    {
      label: 'Weekly Spending Summary',
      description: 'Receive a weekly overview of your spending patterns',
      value: weeklySpendingSummary,
      onChange: (checked: boolean) =>
        handleToggle('weeklyInsightReports', checked, setWeeklySpendingSummary),
    },
    {
      label: 'Monthly Spending Summary',
      description: 'Get a comprehensive monthly report of your finances',
      value: monthlySpendingSummary,
      onChange: (checked: boolean) =>
        handleToggle('monthlyReports', checked, setMonthlySpendingSummary),
    },
    {
      label: 'Budget Warnings',
      description: "Get notified when you're approaching your budget limits",
      value: budgetWarnings,
      onChange: (checked: boolean) =>
        handleToggle('budgetAlerts', checked, setBudgetWarnings),
    },
    {
      label: 'Newsletter Emails',
      description: 'Receive our weekly newsletter with financial tips',
      value: newsletterEmails,
      onChange: (checked: boolean) =>
        handleToggle('weeklyBudgetReports', checked, setNewsletterEmails),
    },
    {
      label: 'Display Upcoming Bills',
      description: 'Show reminders for upcoming bill payments',
      value: upcomingBills,
      onChange: (checked: boolean) =>
        handleToggle('weeklyTransactionReports', checked, setUpcomingBills),
    },
    {
      label: 'Money Saving Insights',
      description: 'Discover opportunities to save on insurance, energy, devices, broadband, etc.',
      value: moneySavingInsights,
      onChange: (checked: boolean) =>
        handleToggle('transactionAlerts', checked, setMoneySavingInsights),
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Flex direction="column" gap="1">
          <Text size="6" weight="bold">
            Manage Notifications
          </Text>
          <Text size="2" color="gray">
            Choose which notifications you'd like to receive
          </Text>
        </Flex>
        <IconButton
          variant="ghost"
          size="3"
          onClick={handleClose}
          className={styles.closeButton}
        >
          <Cross2Icon width="20" height="20" />
        </IconButton>
      </div>

      <div className={styles.content}>
        {notificationSettings.map((setting, index) => (
          <Box key={index} className={styles.settingItem}>
            <Flex justify="between" align="start">
              <Flex direction="column" gap="1" style={{ flex: 1, marginRight: '16px' }}>
                <Flex align="center" gap="2">
                  <BellIcon />
                  <Text size="3" weight="medium">
                    {setting.label}
                  </Text>
                </Flex>
                <Text size="2" color="gray">
                  {setting.description}
                </Text>
              </Flex>
              <Switch
                checked={setting.value}
                onCheckedChange={setting.onChange}
                size="2"
              />
            </Flex>
          </Box>
        ))}
      </div>
    </div>
  )
}
