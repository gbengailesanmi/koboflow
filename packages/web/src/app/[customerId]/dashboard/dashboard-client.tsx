'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from '@radix-ui/themes'
import styles from './dashboard.module.css'
import AccountsCarousel from '../../components/dashboard/accounts-carousel'
import Card from '../../components/dashboard/card/card'
import { MonthlySummary } from '../../components/dashboard/monthly-summary'
import TransactionsDisplay from '@/app/components/transactions/transactions-display'
import { useQueryStateNullable } from '@/hooks/use-query-state'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'
import type { Account, EnrichedTransaction } from '@money-mapper/shared'
import { useDashboardBackground } from '@/hooks/use-dashboard-background'

interface DashboardClientProps {
  customerId: string
  accounts: Account[]
  transactions: EnrichedTransaction[]
}

export default function DashboardClient({
  customerId,
  accounts,
  transactions,
}: DashboardClientProps) {
  const router = useRouter()
  const [hasNavigated, setHasNavigated] = useState(false)
  const [currentMonth, setCurrentMonth] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useQueryStateNullable('accountId')
  
  useDashboardBackground(selectedAccountId)
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

      <Card
        title="Transactions"
        variant='default'
      >
        <>
          {limitedTransactions.length < 1 ?
          <p>No transactions yet</p> :
          <div className={styles.transactionsListWrapper}>
            <TransactionsDisplay transactions={limitedTransactions} />
          </div>}

          <div
            className={`${styles.seeAll} cursor-pointer`}
            role="button"
            onClick={handleSeeAllClick}
          >
            See all transactions
          </div>
        </>
      </Card>


      <Card
        title={`${currentMonth} summary`}
        variant='summary'
      >
        <MonthlySummary
          totalSpend={0}
          upcomingBills={[]}
          totalReceived={0}
          creditScore={0}
        />
      </Card>

      <Card
        title='Emergency fund calculator'
      >
        <div className={styles.summaryContent}>
          {/* Summary content will go here */}
        </div>
      </Card>

      <Card
        title='Exchange rates'
      >
        <div className={styles.summaryContent}>
          {/* Summary content will go here */}
        </div>
      </Card>
    </main>
  )
}
