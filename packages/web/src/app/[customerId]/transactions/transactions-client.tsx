'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction, Account } from '@money-mapper/shared'
import PageLayoutWithSidebar from '@/app/components/sidebar/sidebar'
import { Dialog } from '@radix-ui/themes'
import { DownloadIcon, UploadIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import styles from './transactions.module.css'
import Footer from '@/app/components/footer/footer'
import TransactionMonthPills from '@/app/components/transactions/transaction-month-pills/transaction-month-pills'
import TransactionDetailsDialog from '@/app/components/transactions/transaction-details-dialog/transaction-details-dialog'
import TransactionCard from '@/app/components/transactions/transaction-card/transaction-card'
import TransactionsFilters from '@/app/components/transactions/transactions-filters/transactions-filters'
import { useQueryState, useQueryStateNullable } from '@/hooks/use-query-state'
import { useScrollRestoration } from '@/hooks/use-scroll-restoration'

interface TransactionsClientProps {
  customerId: string
  accounts: Account[]
  transactions: Transaction[]
}

export default function TransactionsClient({
  customerId,
  accounts,
  transactions,
}: TransactionsClientProps) {
  const router = useRouter()

  // URL state for transaction selection, filters, and search
  const [selectedTransactionId, setSelectedTransactionId] = useQueryStateNullable('txnId')
  const [filterAccountId, setFilterAccountId] = useQueryState('accountId', '')
  const [searchQuery, setSearchQuery] = useQueryState('search', '')
  const [selectedMonth, setSelectedMonth] = useQueryStateNullable('month')
  
  // Restore scroll position when navigating back
  useScrollRestoration()
  
  const selectedTransaction = selectedTransactionId 
    ? transactions.find(txn => txn.id === selectedTransactionId) || null
    : null

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
    <PageLayoutWithSidebar customerId={customerId}>
      <Dialog.Root 
        open={!!selectedTransactionId} 
        onOpenChange={(open) => { 
          if (!open) setSelectedTransactionId(null) 
        }}
      >
        <div className={`${styles.PageGrid}`}>
          <div id="filters" className={styles.Header}>
            <ArrowLeftIcon 
              className="w-6 h-6 cursor-pointer" 
              onClick={() => router.back()}
              aria-label="Go back"
            />
            <h1 className="text-xl font-semibold mb-2">Transactions</h1>
            <div className={styles.Filters}>
              <TransactionsFilters
                accounts={accounts}
                filterAccountId={filterAccountId}
                setFilterAccountId={setFilterAccountId}
                searchTerm={searchQuery}
                setSearchTerm={setSearchQuery}
              />
            </div>
          </div>

          <TransactionMonthPills
            months={months}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />

          <div id="transaction-list" ref={transactionsWrapperRef} className={styles.TransactionsWrapper}>
            {filteredTransactions.map(transaction => {
              const isDebit = Number(transaction.amount) < 0
              const amountClass = isDebit ? styles.DebitText : styles.CreditText
              const Icon = isDebit ? UploadIcon : DownloadIcon

              return (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  isDebit={isDebit}
                  amountClass={amountClass}
                  Icon={Icon}
                  onClick={() => setSelectedTransactionId(transaction.id)}
                  cardRef={el => { transactionRefs.current[transaction.id] = el }}
                />
              )
            })}
          </div>
          <Footer opacity={2} />
        </div>

        {selectedTransaction && (
          <TransactionDetailsDialog
            transaction={selectedTransaction}
            onClose={() => setSelectedTransactionId(null)}
          />
        )}
      </Dialog.Root>
    </PageLayoutWithSidebar>
  )
}
