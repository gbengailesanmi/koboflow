'use client'

import type { EnrichedTransaction } from '@koboflow/shared'
import { Box, Card, Flex, Text, Dialog } from '@radix-ui/themes'
import { Cross1Icon, DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import styles from '@/app/components/transactions/transactions.module.css'
import { useState } from 'react'
import { 
  isDebitTransaction, 
  getTransactionTypeLabel, 
  formatDateToISO, 
  formatCurrency,
  formatDateToLocale 
} from '@/helpers/transactions.helpers'

type TransactionColumnProps = {
  transactions: EnrichedTransaction[]
  narrationPopup?: boolean
}

export default function TransactionsDisplay({ transactions, narrationPopup = false }: TransactionColumnProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null)

  return (
    <Dialog.Root
      onOpenChange={open => {
        if (!open) setSelectedTransaction(null)
      }}
    >
      <main className={styles.body}>
        {transactions.map(transaction => {
          const isDebit = isDebitTransaction(transaction.type)
          const Icon = isDebit ? UploadIcon : DownloadIcon

          return (
            <div key={transaction.id}>
              <Dialog.Trigger onClick={() => narrationPopup && setSelectedTransaction(transaction)}>
                <Box className={styles.item}>
                  <Card variant='ghost' className={styles.transactionCard}>
                    <Flex gap='3' align='center'>
                      <Icon className={isDebit ? styles.debit : styles.credit} />
                      <div className={styles.text}>
                        <Text as='div' size='1'>
                          <span>
                            {getTransactionTypeLabel(transaction.type)}<br />
                            <p className={styles.narration}>{transaction.narration}</p>
                            {formatDateToISO(transaction.date)}
                          </span>
                        </Text>
                      </div>

                      <div className={styles.amount}>
                        <Text as='div'>
                          {formatCurrency(transaction.amount)}
                        </Text>
                      </div>
                    </Flex>
                  </Card>
                </Box>
              </Dialog.Trigger>
            </div>
          )
        })}
      </main>

      {narrationPopup && selectedTransaction && (
        <Dialog.Content>
          <Flex gap='3' justify='between' style={{ marginBottom: '0.5rem' }}>
            <Dialog.Title>Transaction Details</Dialog.Title>
            <Dialog.Close>
              <Cross1Icon />
            </Dialog.Close>
          </Flex>
          <Box>
            <Text><strong>Amount:</strong> {selectedTransaction.amount}</Text><br />
            <Text><strong>Narration:</strong> {selectedTransaction.narration}</Text><br />
            <Text><strong>Date:</strong> {formatDateToLocale(selectedTransaction.date)}</Text>
          </Box>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
