'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Text, IconButton, Button } from '@radix-ui/themes'
import { Cross2Icon, Cross1Icon, PlusIcon } from '@radix-ui/react-icons'
import type { Account } from '@koboflow/shared'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import { useMonoConnect } from '@/hooks/use-mono-connect'
import styles from './manage-accounts.module.css'

type ManageAccountsClientProps = {
  customerId: string
  accounts: Account[]
  currency: string
}

export default function ManageAccountsClient({
  customerId,
  accounts,
  currency,
}: ManageAccountsClientProps) {
  const router = useRouter()
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)

  const { openMonoWidget, isLoading } = useMonoConnect({
    onSuccess: () => {
      router.refresh()
    },
    onError: (error) => {
      alert(error)
    },
  })

  const totalNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0)

  const handleDeleteAccount = async (accountId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to unlink this account? This will also delete all associated transactions.'
    )

    if (!confirmed) return

    setDeletingAccountId(accountId)
    
    try {
      // TODO: Implement delete account action
      alert('Delete account functionality coming soon')
      router.refresh()
    } catch (error) {
      alert('Failed to delete account')
    } finally {
      setDeletingAccountId(null)
    }
  }

  const handleClose = () => {
    router.push(`/${customerId}/settings`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Flex direction="column" gap="1">
          <Text size="6" weight="bold">
            Manage Accounts
          </Text>
          <Text size="2" color="gray">
            Link and manage your bank accounts
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
        {/* Total Net Worth */}
        <Box className={styles.netWorthCard}>
          <Text size="2" color="gray" mb="1">
            Total Net Worth
          </Text>
          <Text size="7" weight="bold">
            {formatCurrency(totalNetWorth, currency)}
          </Text>
        </Box>

        {/* Connect Account Button */}
        <Button
          size="3"
          onClick={openMonoWidget}
          disabled={isLoading}
          className={styles.connectButton}
        >
          <PlusIcon />
          {isLoading ? 'Connecting...' : 'Connect New Account'}
        </Button>

        {/* Accounts List */}
        <div className={styles.accountsList}>
          <Text size="2" weight="medium" color="gray" mb="3">
            Linked Accounts ({accounts.length})
          </Text>

          {accounts.length === 0 ? (
            <Box className={styles.emptyState}>
              <Text size="3" color="gray" align="center">
                No accounts linked yet. Connect your first account to get started.
              </Text>
            </Box>
          ) : (
            <div className={styles.accountsGrid}>
              {accounts.map((account) => (
                <Box key={account.id} className={styles.accountCard}>
                  <Flex justify="between" align="start">
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text size="3" weight="bold">
                        {account.name}
                      </Text>
                      <Text size="2" color="gray">
                        {account.account_number}
                      </Text>
                      <Text size="2" color="gray">
                        {account.institution?.name || 'Unknown Bank'}
                      </Text>
                      <Text size="4" weight="bold" mt="2">
                        {formatCurrency(account.balance, currency)}
                      </Text>
                    </Flex>

                    <IconButton
                      variant="ghost"
                      color="red"
                      size="2"
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={deletingAccountId === account.id}
                      className={styles.deleteButton}
                    >
                      <Cross1Icon />
                    </IconButton>
                  </Flex>
                </Box>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
