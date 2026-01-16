import type { Account } from '@koboflow/shared'
import React, { useState } from 'react'
import { useQueryStates, parseAsString } from 'nuqs'
import styles from '@/app/components/transactions/transactions.module.css'
import { DropdownMenu, Button } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ChevronDownIcon, ReloadIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { formatAccountBalance } from '@/helpers/transactions.helpers'

type TransactionsFiltersProps = {
  accounts: Account[]
  onRefresh?: () => Promise<void>
}

export default function TransactionsFilters({
  accounts,
  onRefresh,
}: TransactionsFiltersProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [filters, setFilters] = useQueryStates({
    accountId: parseAsString.withDefault(''),
    type: parseAsString.withDefault('all'),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    search: parseAsString.withDefault(''),
  })

  const { accountId, type, from, to, search } = filters
  const filterType = (type === 'debit' || type === 'credit' ? type : 'all') as 'all' | 'debit' | 'credit'

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
                  onSelect={() => setFilters({ accountId: '' })}
                  disabled={accountId === ''}
                >
                  All accounts {accountId === '' && '✓'}
                </DropdownMenu.Item>
                {accounts.map(account => (
                  <DropdownMenu.Item
                    key={account.id}
                    onSelect={() => setFilters({ accountId: accountId === account.id ? '' : account.id })}
                  >
                    {formatAccountBalance(account.name, account.balance)} {accountId === account.id && '✓'}
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
                  onSelect={() => setFilters({ type: 'all' })}
                  disabled={filterType === 'all'}
                >
                  All {filterType === 'all' && '✓'}
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilters({ type: filterType === 'debit' ? 'all' : 'debit' })}
                >
                  Debit {filterType === 'debit' && '✓'}
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilters({ type: filterType === 'credit' ? 'all' : 'credit' })}
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
                    value={from}
                    onChange={e => setFilters({ from: e.target.value })}
                    placeholder='d'
                  />
                  <ArrowRightIcon />
                  <input
                    type='date'
                    value={to}
                    onChange={e => setFilters({ to: e.target.value })}
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
          value={search}
          onChange={e => setFilters({ search: e.target.value })}
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
