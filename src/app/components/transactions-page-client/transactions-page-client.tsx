'use client'

import type { Transaction } from '@/types/transactions'
import type { Account } from '@/types/account'
import { Box, Card, Flex, Text, Dialog } from '@radix-ui/themes'
import { Cross1Icon, DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import styles from './transactions-page-client.module.css'
import { useState, useMemo } from 'react'
import Footer from '../footer/Footer'

type TransactionsPageClientProps = {
  transactions: Transaction[]
  accounts: Account[]
}

export default function TransactionsPageClient({ transactions, accounts }: TransactionsPageClientProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [filterAccountId, setFilterAccountId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Filter transactions by selected account and search term
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesAccount = !filterAccountId || txn.accountUniqueId === filterAccountId
      const matchesSearch = txn.narration.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesAccount && matchesSearch
    })
  }, [filterAccountId, searchTerm, transactions])

  return (
    <Dialog.Root
      onOpenChange={open => {
        if (!open) setSelectedTransaction(null)
      }}
    >
      <div className={styles.Header}>
        <h2>Transactions</h2>
        <div className={styles.Filters}>
          <select
            value={filterAccountId}
            onChange={e => setFilterAccountId(e.target.value)}
            className={styles.AccountsFilter}
          >
            <option value="">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.uniqueId}>
                {account.name} — £{Number(account.balance).toFixed(2)}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.SearchInput}
          />
        </div>
      </div>

      <div className={styles.TransactionsWrapper}>
        {filteredTransactions.map(transaction => {
          const isDebit = Number(transaction.amount) < 0
          const amountClass = isDebit ? styles.DebitText : styles.CreditText
          const Icon = isDebit ? UploadIcon : DownloadIcon

          return (
            <div key={transaction.id} className={styles.BoxWrapper}>
              <Dialog.Trigger onClick={() => setSelectedTransaction(transaction)}>
                <Box className={styles.CardWrapper} style={{ cursor: 'pointer' }}>
                  <Card>
                    <Flex gap="3" align="center">
                      <div className={styles.IconWrapper}>
                        <Icon />
                      </div>
                      <div className={styles.TextWrapper}>
                        <Text as="div" size="2">
                          {isDebit ? 'Debit' : 'Credit'}
                        </Text>
                        <Text as="div" size="2" weight="bold">
                          {transaction.narration}
                        </Text>
                        <Text as="div" size="1">
                          {new Date(transaction.bookedDate).toISOString().slice(0, 10)}
                        </Text>
                      </div>
                      <div className={styles.AmountWrapper}>
                        <Text as="div" size="3" weight="bold" className={amountClass}>
                          {transaction.amount}
                        </Text>
                      </div>
                    </Flex>
                  </Card>
                </Box>
              </Dialog.Trigger>
            </div>
          )
        })}
        <Footer />
      </div>

      {selectedTransaction && (
        <Dialog.Content>
          <Flex gap="3" justify="between" style={{ marginBottom: '1rem' }}>
            <Dialog.Title>Transaction Details</Dialog.Title>
            <Dialog.Close>
              <Cross1Icon />
            </Dialog.Close>
          </Flex>
          <Box>
            <Text><strong>ID:</strong> {selectedTransaction.id}<br /></Text>
            <Text><strong>Amount:</strong> {selectedTransaction.amount}</Text>
            <Text><strong>Narration:</strong> {selectedTransaction.narration}<br /></Text>
            <Text><strong>Booked Date:</strong> {new Date(selectedTransaction.bookedDate).toLocaleString()}</Text>
          </Box>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
