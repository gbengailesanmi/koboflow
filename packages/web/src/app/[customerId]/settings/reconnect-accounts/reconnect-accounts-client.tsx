'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Text, IconButton, Button } from '@radix-ui/themes'
import { Cross2Icon, Link2Icon, ReloadIcon } from '@radix-ui/react-icons'
import type { Account } from '@money-mapper/shared'
import styles from './reconnect-accounts.module.css'

type ReconnectAccountsClientProps = {
  customerId: string
  accounts: Account[]
}

export default function ReconnectAccountsClient({
  customerId,
  accounts,
}: ReconnectAccountsClientProps) {
  const router = useRouter()
  const [reconnectingAll, setReconnectingAll] = useState(false)
  const [reconnectingAccountId, setReconnectingAccountId] = useState<string | null>(null)

  const handleReconnect = async (accountId: string) => {
    setReconnectingAccountId(accountId)
    
    try {
      // TODO: Implement reconnect account action
      alert('Reconnect account functionality coming soon')
      router.refresh()
    } catch (error) {
      alert('Failed to reconnect account')
    } finally {
      setReconnectingAccountId(null)
    }
  }

  const handleReconnectAll = async () => {
    const confirmed = window.confirm(
      `Reconnect all ${accounts.length} accounts? This will refresh your account data.`
    )

    if (!confirmed) return

    setReconnectingAll(true)
    
    try {
      // TODO: Implement reconnect all accounts action
      alert('Reconnect all accounts functionality coming soon')
      router.refresh()
    } catch (error) {
      alert('Failed to reconnect accounts')
    } finally {
      setReconnectingAll(false)
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
            Reconnect Accounts
          </Text>
          <Text size="2" color="gray">
            Refresh your bank account connections
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
        {accounts.length === 0 ? (
          <Box className={styles.emptyState}>
            <Text size="3" color="gray" align="center">
              No accounts to reconnect. Link an account first.
            </Text>
          </Box>
        ) : (
          <>
            {/* Accounts List */}
            <div className={styles.accountsList}>
              {accounts.map((account) => (
                <Box key={account.id} className={styles.accountItem}>
                  <Flex justify="between" align="center">
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Flex align="center" gap="2">
                        <Link2Icon />
                        <Text size="3" weight="bold">
                          {account.name}
                        </Text>
                      </Flex>
                      <Text size="2" color="gray">
                        {account.institution?.name || 'Unknown Bank'}
                      </Text>
                    </Flex>

                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => handleReconnect(account.id)}
                      disabled={reconnectingAccountId === account.id || reconnectingAll}
                    >
                      <ReloadIcon />
                      {reconnectingAccountId === account.id ? 'Reconnecting...' : 'Reconnect'}
                    </Button>
                  </Flex>
                </Box>
              ))}
            </div>

            {/* Reconnect All Button */}
            <Box mt="4">
              <Button
                size="3"
                style={{ width: '100%' }}
                onClick={handleReconnectAll}
                disabled={reconnectingAll || reconnectingAccountId !== null}
              >
                <ReloadIcon />
                {reconnectingAll ? 'Reconnecting All...' : 'Reconnect All Accounts'}
              </Button>
            </Box>
          </>
        )}
      </div>
    </div>
  )
}
