import type { Account } from '@koboflow/shared'
import React, { useState } from 'react'
import styles from '@/app/components/transactions/transactions.module.css'
import { DropdownMenu, Button, Grid } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ChevronDownIcon, ReloadIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { formatAccountBalance } from '@/helpers/transactions.helpers'

type TransactionsFiltersProps = {
  accounts: Account[]
  filterAccountId: string
  setFilterAccountId: (id: string) => void
  filterType: 'all' | 'debit' | 'credit'
  setFilterType: (type: 'all' | 'debit' | 'credit') => void
  dateFrom: string
  setDateFrom: (date: string) => void
  dateTo: string
  setDateTo: (date: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  onRefresh?: () => Promise<void>
}

export default function TransactionsFilters({
  accounts,
  filterAccountId,
  setFilterAccountId,
  filterType,
  setFilterType,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
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
    <div className={styles.filters}>
      {/* Combined Filters Dropdown */}
      <div className={styles.accounts}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant='soft' color='gray' radius='full'>
              Filters
              <ChevronDownIcon width='18' height='18' />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {/* Accounts Section */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Accounts</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item 
                  onSelect={() => setFilterAccountId('')}
                  disabled={filterAccountId === ''}
                >
                  All accounts {filterAccountId === '' && '✓'}
                </DropdownMenu.Item>
                {accounts.map(account => (
                  <DropdownMenu.Item
                    key={account.id}
                    onSelect={() => setFilterAccountId(filterAccountId === account.id ? '' : account.id)}
                  >
                    {formatAccountBalance(account.name, account.balance)} {filterAccountId === account.id && '✓'}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            
            <DropdownMenu.Separator />
            
            {/* Type Section */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Type</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item 
                  onSelect={() => setFilterType('all')}
                  disabled={filterType === 'all'}
                >
                  All {filterType === 'all' && '✓'}
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilterType(filterType === 'debit' ? 'all' : 'debit')}
                >
                  Debit {filterType === 'debit' && '✓'}
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilterType(filterType === 'credit' ? 'all' : 'credit')}
                >
                  Credit {filterType === 'credit' && '✓'}
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            
            <DropdownMenu.Separator />
            
            {/* Date Section */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Date Range</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <div className={styles.dateRange}>
                  <input
                    type='date'
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    placeholder='d'
                  />
                  <ArrowRightIcon />
                  <input
                    type='date'
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    placeholder=''
                  />
                </div>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      {/* Search */}
      <Button className={styles.search}>
        <MagnifyingGlassIcon height='18' width='18' />
        <input
          id='search'
          type='search'
          placeholder='Search'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </Button>

      {/* Refresh Button */}
      {onRefresh && (
        <div>
          <Button
            variant='soft'
            color='gray'
            radius='full'
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <ReloadIcon width='16' height='16' className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      )}
    </div>
  )
}
