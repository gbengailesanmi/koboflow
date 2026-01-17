import type { Account, EnrichedTransaction } from '@koboflow/shared'
import React, { useState } from 'react'
import { useQueryStates, parseAsString } from 'nuqs'
import styles from '@/app/components/transactions/transactions.module.css'
import { DropdownMenu, Button } from '@radix-ui/themes'
import { MagnifyingGlassIcon, ChevronDownIcon, SymbolIcon, ArrowRightIcon, DownloadIcon } from '@radix-ui/react-icons'
import { formatAccountBalance } from '@/helpers/transactions.helpers'
import { downloadTransactionsAsCSV, printTransactions } from '@/utils/download-transactions'

type TransactionsFiltersProps = {
  accounts: Account[]
  transactions?: EnrichedTransaction[]
  onRefresh?: () => Promise<void>
}

export default function TransactionsFilters({
  accounts,
  transactions = [],
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
            <Button className={styles.filter}>
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
                  All accounts
                </DropdownMenu.Item>
                {accounts.map(account => (
                  <DropdownMenu.Item
                    key={account.id}
                    onSelect={() => setFilters({ accountId: accountId === account.id ? '' : account.id })}
                    disabled={accountId === account.id}
                  >
                    {formatAccountBalance(account.name, account.balance)}
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
                  All
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilters({ type: filterType === 'debit' ? 'all' : 'debit' })}
                  disabled={filterType === 'debit'}
                >
                  Debit
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onSelect={() => setFilters({ type: filterType === 'credit' ? 'all' : 'credit' })}
                  disabled={filterType === 'credit'}
                >
                  Credit
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
          placeholder='Search...'
          value={search}
          onChange={e => setFilters({ search: e.target.value })}
        />
      </Button>

      {/* Refresh Button */}
      {onRefresh && (
        <div>
          <Button
            className={styles.refresh}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <SymbolIcon width='16' height='16' className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      )}

      {/* Download/Print Button */}
      {transactions.length > 0 && (
        <div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button className={styles.refresh}>
                <DownloadIcon width='16' height='16' />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onSelect={() => downloadTransactionsAsCSV(transactions)}>
                Download as CSV
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => {
                const selectedAccount = accounts.find(acc => acc.id === accountId)
                printTransactions(transactions, {
                  accountId,
                  accountName: selectedAccount?.name,
                  type: filterType,
                  from,
                  to,
                  search
                })
              }}>
                Print
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      )}
    </div>
  )
}
