'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from '@radix-ui/themes'
import styles from './dashboard.module.css'
import AccountsCarousel from '../../components/dashboard/accounts-carousel'
import TransactionsColumn from '@/app/components/dashboard/transactions-column/transactions-column'
import { useQueryStateNullable } from '@/hooks/use-query-state'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'
import type { Account, EnrichedTransaction } from '@money-mapper/shared'

interface DashboardClientProps {
  customerId: string
  accounts: Account[]
  transactions: EnrichedTransaction[]
}

export default function DashboardClient({
  customerId,
  accounts,
  transactions
}: DashboardClientProps) {
  const router = useRouter()
  const [hasNavigated, setHasNavigated] = useState(false)
  const [currentMonth, setCurrentMonth] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useQueryStateNullable('accountId')
  
  useScrollRestoration()

  const filteredTransactions = useMemo(() => 
    selectedAccountId
      ? transactions.filter(txn => txn.accountId === selectedAccountId)
      : transactions,
    [selectedAccountId, transactions]
  )

  const handleNavigate = useCallback(() => setHasNavigated(true), [])
  
  const initialiseCurrentMonth = useCallback(() => {
    setCurrentMonth(new Date().toLocaleString('default', { month: 'long' }))
  }, [])

  useEffect(() => {
    initialiseCurrentMonth()
  }, [initialiseCurrentMonth])

  const handleSeeAllClick = useCallback(() => {
    router.push(`/${customerId}/transactions`)
  }, [router, customerId])

  const limitedTransactions = useMemo(() => 
    filteredTransactions.slice(0, 5),
    [filteredTransactions]
  )

  return (
    <main className={`${styles.main} page-main`}>
      <Grid className={styles.accountsGrid}>
        <AccountsCarousel
          accounts={accounts}
          selectedAccount={selectedAccountId}
          setSelectedAccount={setSelectedAccountId}
          onNavigate={handleNavigate}
        />
      </Grid>

      <Grid
        rows="3"
        className={styles.transactionsGrid}
        style={{ gridTemplateRows: '2.5rem 1fr 2.5rem' }}
      >
        <div style={{ display: 'flex', height: '100%', padding: '.3rem' }}>
          <h2 className="text-sm font-semibold mb-2">Transactions</h2>
        </div>

        <div className={styles.transactionsListWrapper}>
          <TransactionsColumn transactions={limitedTransactions} />
        </div>

        <div
          className="justify-center items-center flex cursor-pointer"
          role="button"
          onClick={handleSeeAllClick}
        >
          See all transactions
        </div>
      </Grid>


      <Grid className={styles.grid6}>
        <h2 className="text-sm font-semibold">{currentMonth} summary</h2>
      </Grid>
    </main>
  )
}
