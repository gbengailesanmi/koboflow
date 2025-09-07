import type { Account } from '@/types/account'
import React from 'react'
import styles from '@/app/components/transactions-filters/transactions-filters.module.css'
import { DropdownMenu, Button, Grid } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@radix-ui/react-icons'

type TransactionsFiltersProps = {
  accounts: Account[]
  filterAccountId: string
  setFilterAccountId: (id: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export default function TransactionsFilters({
  accounts,
  filterAccountId,
  setFilterAccountId,
  searchTerm,
  setSearchTerm,
}: TransactionsFiltersProps) {
  return (
    <Grid rows='1' columns='2' className={styles.GridWrapper}>
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
                onSelect={() => setFilterAccountId(account.uniqueId)}
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

      </Grid>
  )
}
