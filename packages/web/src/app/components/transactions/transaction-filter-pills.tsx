import React from 'react'
import type { Account } from '@koboflow/shared'
import { useQueryStates, parseAsString } from 'nuqs'
import styles from '@/app/components/transactions/transactions.module.css'
import { Cross2Icon } from '@radix-ui/react-icons'

type TransactionFilterPillsProps = {
  accounts: Account[]
}

export default function TransactionFilterPills({
  accounts,
}: TransactionFilterPillsProps) {
  const [filters, setFilters] = useQueryStates({
    accountId: parseAsString.withDefault(''),
    type: parseAsString.withDefault('all'),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
  })

  const { accountId, type, from, to } = filters
  const filterType = (type === 'debit' || type === 'credit' ? type : 'all') as 'all' | 'debit' | 'credit'
  
  const hasActiveFilters = accountId || filterType !== 'all' || from || to
  
  if (!hasActiveFilters) {
    return null
  }

  const selectedAccount = accounts.find(account => account.id === accountId)

  return (
    <div className={styles.filterPillsContainer}>
      {selectedAccount && (
        <button
          className={styles.filterPill}
          onClick={() => setFilters({ accountId: '' })}
          type="button"
          aria-label={`Remove ${selectedAccount.name} filter`}
        >
          <span>{selectedAccount.name}</span>
          <Cross2Icon className={styles.filterPillIcon} />
        </button>
      )}
      
      {filterType !== 'all' && (
        <button
          className={styles.filterPill}
          onClick={() => setFilters({ type: 'all' })}
          type="button"
          aria-label={`Remove ${filterType} filter`}
        >
          <span>{filterType === 'debit' ? 'Debit' : 'Credit'}</span>
          <Cross2Icon className={styles.filterPillIcon} />
        </button>
      )}
      
      {from && (
        <button
          className={styles.filterPill}
          onClick={() => setFilters({ from: null })}
          type="button"
          aria-label="Remove start date filter"
        >
          <span>From {new Date(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <Cross2Icon className={styles.filterPillIcon} />
        </button>
      )}
      
      {to && (
        <button
          className={styles.filterPill}
          onClick={() => setFilters({ to: null })}
          type="button"
          aria-label="Remove end date filter"
        >
          <span>Until {new Date(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <Cross2Icon className={styles.filterPillIcon} />
        </button>
      )}
    </div>
  )
}
