'use client'

import { useState } from 'react'
import { MixerVerticalIcon } from '@radix-ui/react-icons'
import { Dialog, Flex, Text, ScrollArea, Box } from '@radix-ui/themes'
import { useSelectedItems } from '@/store'
import type { Account } from '@/types/account'
import { formatCurrency } from '@/app/components/analytics/utils/format-currency'
import styles from './account-filter-menu.module.css'

type AccountFilterMenuProps = {
  accounts: Account[]
  currency: string
  asDialogContent?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AccountFilterMenu({ accounts, currency, asDialogContent = false, open: controlledOpen, onOpenChange }: AccountFilterMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const { selectedAccountId, setSelectedAccount } = useSelectedItems()
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const effectiveAccountId = selectedAccountId || 'all'

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId === 'all' ? null : accountId)
    setOpen(false)
  }

  const dialogContent = (
    <Dialog.Content 
      className={styles.menuContent}
      style={{ maxWidth: '350px', padding: '0' }}
    >
      <Dialog.Title className={styles.menuTitle}>
        Filter by Account
      </Dialog.Title>

      <ScrollArea 
        style={{ maxHeight: '400px' }}
        scrollbars="vertical"
      >
        <Box className={styles.accountList}>
          <Flex 
            className={`${styles.accountItem} ${effectiveAccountId === 'all' ? styles.accountItemActive : ''}`}
            onClick={() => handleAccountSelect('all')}
          >
            <Text size="3" weight="medium">All Accounts</Text>
          </Flex>

          {accounts.map((account) => (
            <Flex 
              key={account.id}
              className={`${styles.accountItem} ${effectiveAccountId === account.uniqueId ? styles.accountItemActive : ''}`}
              onClick={() => handleAccountSelect(account.uniqueId)}
            >
              <Flex direction="column" gap="1" style={{ flex: 1 }}>
                <Text size="3" weight="medium">{account.name}</Text>
                <Text size="2" color="gray">
                  {currency === 'GBP' ? '£' : formatCurrency(0, currency).charAt(0)}
                  {Number(account.balance).toFixed(2)}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Box>
      </ScrollArea>
    </Dialog.Content>
  )

  if (asDialogContent) {
    return dialogContent
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <button 
          className={styles.filterButton}
          aria-label="Filter by account"
        >
          <MixerVerticalIcon width="15" height="15" />
        </button>
      </Dialog.Trigger>
      {dialogContent}
    </Dialog.Root>
  )
}
