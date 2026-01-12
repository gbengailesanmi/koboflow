'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EnrichedTransaction, Account } from '@koboflow/shared'
import { Dialog } from '@radix-ui/themes'
import styles from './transactions.module.css'
import TransactionMonthPills from '@/app/components/transactions/transaction-month-pills'
import TransactionDetailsDialog from '@/app/components/transactions/transaction-details-dialog'
import TransactionsDisplay from '@/app/components/transactions/transactions-display'
import TransactionsFilters from '@/app/components/transactions/transactions-filters'
import { useQueryState, useQueryStateNullable } from '@/hooks/use-query-state'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'
import { runAction } from '@/lib/actions/run-action'
import { monoSyncTransactionsAction } from '@/app/actions/mono-actions'

interface TransactionsClientProps {
  customerId: string
  accounts: Account[]
  transactions: EnrichedTransaction[]
}

export default function TransactionsClient({
  customerId,
  accounts,
  transactions,
}: TransactionsClientProps) {
  const router = useRouter()

  const [selectedTransactionId, setSelectedTransactionId] = useQueryStateNullable('txnId')
  const [filterAccountId, setFilterAccountId] = useQueryState('accountId', '')
  const [searchQuery, setSearchQuery] = useQueryState('search', '')
  const [selectedMonth, setSelectedMonth] = useQueryStateNullable('month')
  
  useScrollRestoration()
  
  const selectedTransaction = selectedTransactionId 
    ? transactions.find(txn => txn.id === selectedTransactionId) || null
    : null

  const handleRefresh = async () => {
    const accountToSync = filterAccountId || accounts[0]?.id
    
    if (!accountToSync) {
      console.error('No account available to sync')
      return
    }

    const accountTransactions = transactions.filter(txn => txn.accountId === accountToSync)
    
    if (accountTransactions.length > 0) {
      const sortedTransactions = [...accountTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      const mostRecentDate = new Date(sortedTransactions[0].date)
      const startDate = mostRecentDate.toISOString().split('T')[0]
      
      await runAction(monoSyncTransactionsAction, accountToSync, {
        start: startDate
      })
    } else {
      await runAction(monoSyncTransactionsAction, accountToSync)
    }
  }

  const months = useMemo(() => {
    const monthSet = new Set<string>()
    transactions.forEach(txn => {
      const newDate = new Date(txn.date)
      const newMonth = newDate.toISOString().slice(0, 7)
      monthSet.add(newMonth)
    })
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesAccount = !filterAccountId || txn.accountId === filterAccountId
      const matchesSearch = txn.narration.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesAccount && matchesSearch
    })
  }, [filterAccountId, searchQuery, transactions])

  const transactionsByMonth = useMemo(() => {
    const map = new Map<string, string[]>()
    filteredTransactions.forEach(txn => {
      const month = new Date(txn.date).toISOString().slice(0, 7)
      if (!map.has(month)) map.set(month, [])
      map.get(month)!.push(txn.id)
    })
    return map
  }, [filteredTransactions])

  const transactionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const transactionsWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedMonth || !transactionsWrapperRef.current) return
    const txnsInMonth = transactionsByMonth.get(selectedMonth)

    if (!txnsInMonth || txnsInMonth.length === 0) return
    const lastTxnId = txnsInMonth[txnsInMonth.length - 1]
    const lastTxnEl = transactionRefs.current[lastTxnId]

    if (lastTxnEl && transactionsWrapperRef.current) {
      const containerTop = transactionsWrapperRef.current.getBoundingClientRect().top
      const elementTop = lastTxnEl.getBoundingClientRect().top
      const scrollTop = transactionsWrapperRef.current.scrollTop
      const offset = elementTop - containerTop + scrollTop

      transactionsWrapperRef.current.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }, [selectedMonth, transactionsByMonth])

  return (
    <Dialog.Root 
      open={!!selectedTransactionId} 
      onOpenChange={(open) => { 
        if (!open) setSelectedTransactionId(null) 
      }}
    >
      <div className={`${styles.PageGrid}`}>
          <div id="filters" className={styles.Filters}>
            <TransactionsFilters
              accounts={accounts}
              filterAccountId={filterAccountId}
              setFilterAccountId={setFilterAccountId}
              searchTerm={searchQuery}
              setSearchTerm={setSearchQuery}
              onRefresh={handleRefresh}
            />
          </div>

          <TransactionMonthPills
            months={months}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />

          <div id="transaction-body" ref={transactionsWrapperRef} className={styles.TransactionsWrapper}>
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
        </div>

        {selectedTransaction && (
          <TransactionDetailsDialog
            transaction={selectedTransaction}
            onClose={() => setSelectedTransactionId(null)}
          />
        )}
      </Dialog.Root>
  )
}
