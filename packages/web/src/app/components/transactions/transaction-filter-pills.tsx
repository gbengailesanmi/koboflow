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
  
  const selectedAccount = accounts.find(account => account.id === accountId)

  return (
    <div className={styles.filterPillsContainer}>
      <span className="inline-block invisible" />
      {selectedAccount && (
        <button
          className={styles.pill}
          onClick={() => setFilters({ accountId: '' })}
          type="button"
          aria-label={`Remove ${selectedAccount.name} filter`}
        >
          <span>{selectedAccount.name}</span>
          <Cross2Icon className={styles.icon} />
        </button>
      )}
      
      {filterType !== 'all' && (
        <button
          className={styles.pill}
          onClick={() => setFilters({ type: 'all' })}
          type="button"
          aria-label={`Remove ${filterType} filter`}
        >
          <span>{filterType === 'debit' ? 'Debit' : 'Credit'}</span>
          <Cross2Icon className={styles.icon} />
        </button>
      )}
      
      {from && (
        <button
          className={styles.pill}
          onClick={() => setFilters({ from: null })}
          type="button"
          aria-label="Remove start date filter"
        >
          <span>From {new Date(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <Cross2Icon className={styles.icon} />
        </button>
      )}
      
      {to && (
        <button
          className={styles.pill}
          onClick={() => setFilters({ to: null })}
          type="button"
          aria-label="Remove end date filter"
        >
          <span>Until {new Date(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <Cross2Icon className={styles.icon} />
        </button>
      )}
    </div>
  )
}
