import type { Account } from '@koboflow/shared'
import React, { useState } from 'react'
import styles from '@/app/components/transactions/transactions.module.css'
import { DropdownMenu, Button, Grid } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ChevronDownIcon, ReloadIcon } from '@radix-ui/react-icons'

type TransactionsFiltersProps = {
  accounts: Account[]
  filterAccountId: string
  setFilterAccountId: (id: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  onRefresh?: () => Promise<void>
}

export default function TransactionsFilters({
  accounts,
  filterAccountId,
  setFilterAccountId,
  searchTerm,
  setSearchTerm,
  onRefresh,
}: TransactionsFiltersProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Grid rows='1' columns='3' className={styles.GridWrapper}>
      <div className={styles.AccountsFilter}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="soft" color='gray' radius='full'>
                  Filter by account
              <div className={styles.DropdownIconWrapper}>
              <ChevronDownIcon width='24' height='24' />
              </div>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={() => setFilterAccountId('')}>
              All accounts
            </DropdownMenu.Item>
            {accounts.map(account => (
              <DropdownMenu.Item
                key={account.id}
                onSelect={() => setFilterAccountId(account.id)}
              >
                {account.name} — £{Number(account.balance).toFixed(2)}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      <div className={styles.SearchInputWrapper}>
        <div className={styles.MagnifyIconWrapper}>
          <MagnifyingGlassIcon height="24" width="24" />
        </div>
        <input
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.SearchInput}
        />
      </div>

      {onRefresh && (
        <div className={styles.RefreshButtonWrapper}>
          <Button
            variant="soft"
            color="gray"
            radius="full"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <ReloadIcon width="16" height="16" className={isRefreshing ? styles.spinning : ''} />
          </Button>
        </div>
      )}

      </Grid>
  )
}
