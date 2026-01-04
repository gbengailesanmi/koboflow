'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from '@radix-ui/themes'
import styles from './dashboard.module.css'
import AccountsCarousel from '../../components/dashboard/accounts-carousel'
import CollapsibleCard from '../../components/dashboard/collapsible-card/collapsible-card'
import TransactionsDisplay from '@/app/components/transactions/transactions-display'
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
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(true)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true)
  const [isEmergencyFundExpanded, setIsEmergencyFundExpanded] = useState(false)
  
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

      <CollapsibleCard
        title="Transactions"
        isExpanded={isTransactionsExpanded}
        onToggle={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
        className={isTransactionsExpanded ? 'max-h-[40dvh]' : 'max-h-auto'}
      >
        <>
          <div className={styles.transactionsListWrapper}>
            <TransactionsDisplay transactions={limitedTransactions} />
          </div>

          <div
            className={`${styles.seeAll} cursor-pointer`}
            role="button"
            onClick={handleSeeAllClick}
          >
            See all transactions
          </div>
        </>
      </CollapsibleCard>


      <CollapsibleCard
        title={`${currentMonth} summary`}
        isExpanded={isSummaryExpanded}
        onToggle={() => setIsSummaryExpanded(!isSummaryExpanded)}
      >
        <div className={styles.summaryContent}>
          {/* Summary content will go here */}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title='Emergency fund calculator'
        isExpanded={isEmergencyFundExpanded}
        onToggle={() => setIsEmergencyFundExpanded(!isEmergencyFundExpanded)}
      >
        <div className={styles.summaryContent}>
          {/* Summary content will go here */}
        </div>
      </CollapsibleCard>
    </main>
  )
}
