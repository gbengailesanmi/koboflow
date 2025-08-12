'use client'

import type { Transaction } from '@/types/transactions'
import type { Account } from '@/types/account'
import { Dialog } from '@radix-ui/themes'
import { DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import styles from './transactions-page-client.module.css'
import { useState, useMemo, useRef, useEffect } from 'react'
import Footer from '../footer/Footer'
import TransactionMonthPills from '@/app/components/transaction-month-pills/transaction-month-pills'
import TransactionDetailsDialog from '@/app/components/transaction-details-dialog/transaction-details-dialog'
import TransactionCard from '@/app/components/transaction-card/transaction-card'
import TransactionsFilters from '@/app/components/transactions-filters/transactions-filters'

type TransactionsPageClientProps = {
  transactions: Transaction[]
  accounts: Account[]
}

export default function TransactionsPageClient({ transactions, accounts }: TransactionsPageClientProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [filterAccountId, setFilterAccountId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const months = useMemo(() => {
    const monthSet = new Set<string>()
    transactions.forEach(txn => {
      const newDate = new Date(txn.bookedDate)
      const newMonth = newDate.toISOString().slice(0, 7)
      monthSet.add(newMonth)
    })
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  // Filter by account and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesAccount = !filterAccountId || txn.accountUniqueId === filterAccountId
      const matchesSearch = txn.narration.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesAccount && matchesSearch
    })
  }, [filterAccountId, searchTerm, transactions])

  // Map month -> transactions
  const transactionsByMonth = useMemo(() => {
    const map = new Map<string, string[]>()
    filteredTransactions.forEach(txn => {
      const month = new Date(txn.bookedDate).toISOString().slice(0, 7)
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
    <Dialog.Root onOpenChange={open => { if (!open) setSelectedTransaction(null) }}>
      <div className={styles.Header}>
        <h1 className='text-xl font-semibold mb-2'>Transactions</h1>
        <div className={styles.Filters}>
            <TransactionsFilters
              accounts={accounts}
              filterAccountId={filterAccountId}
              setFilterAccountId={setFilterAccountId}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
        </div>
      </div>

      <TransactionMonthPills
        months={months}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      {/* Transactions list with vertical scroll */}
      <div
        ref={transactionsWrapperRef}
        className={styles.TransactionsWrapper}
        style={{ overflowY: 'auto', maxHeight: '75dvh' }}
      >
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
              onClick={() => setSelectedTransaction(transaction)}
              cardRef={el => { transactionRefs.current[transaction.id] = el }}
            />
          )
        })}
        <Footer />
      </div>

      {selectedTransaction && (
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </Dialog.Root>
  )
}
