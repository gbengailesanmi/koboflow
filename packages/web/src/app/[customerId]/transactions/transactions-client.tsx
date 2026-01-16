'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import type { EnrichedTransaction, Account } from '@koboflow/shared'
import { Dialog } from '@radix-ui/themes'
import { useQueryState, useQueryStates, parseAsString } from 'nuqs'
import styles from './transactions.module.css'
import { PageLayout } from '@/app/components/page-layout/page-layout'
import { useHeaderFooterContext } from '@/providers/header-footer-provider'
import TransactionMonthPills from '@/app/components/transactions/transaction-month-pills'
import TransactionFilterPills from '@/app/components/transactions/transaction-filter-pills'
import TransactionDetailsDialog from '@/app/components/transactions/transaction-details-dialog'
import TransactionsDisplay from '@/app/components/transactions/transactions-display'
import TransactionsFilters from '@/app/components/transactions/transactions-filters'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'
import { runAction } from '@/lib/actions/run-action'
import { monoSyncTransactionsAction } from '@/app/actions/mono-actions'
import { useAccounts, useTransactions } from '@/hooks/use-data'
import { extractMonthsFromTransactions, groupTransactionsByMonth } from '@/helpers/transactions.helpers'

export default function TransactionsClient() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()
  const { scrollContainerRef } = useHeaderFooterContext()

  const [selectedMonth] = useQueryState('month')
  const [selectedTransactionId, setSelectedTransactionId] = useQueryState('txnId', parseAsString.withDefault(''))
  
  const [filters] = useQueryStates({
    accountId: parseAsString.withDefault(''),
    type: parseAsString.withDefault('all'),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    search: parseAsString.withDefault(''),
  })

  const { accountId: filterAccountId, type, from: dateFrom, to: dateTo, search: searchQuery } = filters
  const filterType = (type === 'debit' || type === 'credit' ? type : 'all') as 'all' | 'debit' | 'credit'
  
  useScrollRestoration()
  
  const selectedTransaction = selectedTransactionId 
    ? transactions.find(txn => txn.id === selectedTransactionId) || null
    : null

  const handleRefresh = async () => {
    if (accounts.length === 0) return

    for (const account of accounts) {
      const accountTransactions = transactions.filter(txn => txn.accountId === account.id)
      
      const options = accountTransactions.length > 0 && account.lastRefreshed
        ? { 
            start: new Date(account.lastRefreshed).toISOString(),
            end: new Date().toISOString()
          }
        : undefined
      
      await runAction(monoSyncTransactionsAction, account.id, options)
    }
  }

  const months = useMemo(() => extractMonthsFromTransactions(transactions), [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesAccount = !filterAccountId || txn.accountId === filterAccountId
      const matchesSearch = txn.narration.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || txn.type === filterType
      
      let matchesDateRange = true
      if (dateFrom || dateTo) {
        const txnDate = new Date(txn.date)
        if (dateFrom && txnDate < new Date(dateFrom)) matchesDateRange = false
        if (dateTo && txnDate > new Date(dateTo)) matchesDateRange = false
      }
      
      return matchesAccount && matchesSearch && matchesType && matchesDateRange
    })
  }, [filterAccountId, searchQuery, filterType, dateFrom, dateTo, transactions])

  const transactionsByMonth = useMemo(() => 
    groupTransactionsByMonth(filteredTransactions),
    [filteredTransactions]
  )

  const transactionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!selectedMonth || !scrollContainerRef.current) return
    const txnsInMonth = transactionsByMonth.get(selectedMonth)

    if (!txnsInMonth || txnsInMonth.length === 0) return
    const lastTxnId = txnsInMonth[txnsInMonth.length - 1]
    const lastTxnEl = transactionRefs.current[lastTxnId]

    if (lastTxnEl && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top
      const elementTop = lastTxnEl.getBoundingClientRect().top
      const scrollTop = scrollContainerRef.current.scrollTop
      const offset = elementTop - containerTop + scrollTop

      scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }, [selectedMonth, transactionsByMonth, scrollContainerRef])

  return (
    <Dialog.Root 
      open={!!selectedTransactionId} 
      onOpenChange={(open) => { 
        if (!open) setSelectedTransactionId(null) 
      }}
    >
      <PageLayout
        title="Transactions"
        subtitle="View and manage all your transactions"
        stickySection={
          <>
            <div id='filters' className={styles.Filters}>
              <TransactionsFilters
                accounts={accounts}
                onRefresh={handleRefresh}
              />
            </div>

            <TransactionMonthPills
              months={months}
            />

            <TransactionFilterPills
              accounts={accounts}
            />
          </>
        }
      >
        <div className={styles.TransactionsWrapper}>
          {filteredTransactions.map(transaction => {
            return (
              <div key={transaction.id} ref={(el) => { transactionRefs.current[transaction.id] = el }}>
                <TransactionsDisplay
                  transactions={[transaction]}
                  narrationPopup
                />
              </div>
            )
          })}
        </div>
      </PageLayout>

      {selectedTransaction && (
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          onClose={() => setSelectedTransactionId('')}
        />
      )}
    </Dialog.Root>
  )
}
