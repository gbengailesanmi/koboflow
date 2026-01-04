'use client'

import type { EnrichedTransaction } from '@money-mapper/shared'
import { Box, Card, Flex, Text, Dialog } from '@radix-ui/themes'
import { Cross1Icon, DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import styles from '@/app/components/transactions/transactions.module.css'
import { useState } from 'react'

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
      <div className={styles.transactionsWrapper}>
        {transactions.map(transaction => {
          const isDebit = Number(transaction.amount) < 0
          const transactionType = isDebit ? styles.debit : styles.credit
          const Icon = isDebit ? UploadIcon : DownloadIcon

          return (
            <div>
              <Dialog.Trigger onClick={() => narrationPopup && setSelectedTransaction(transaction)}>
                <Box className={styles.item}>
                  <Card>
                    <Flex gap='3' align='center'>
                      <Icon />
                      <div className={styles.text}>
                        <Text as='div' size='1'>
                          <span>
                            {isDebit ? 'Debit' : 'Credit'}<br />
                            <p className={styles.narration}>{transaction.narration}</p>
                            {new Date(transaction.date).toISOString().slice(0, 10)}
                          </span>
                        </Text>
                      </div>

                      <div className={styles.amount}>
                        <Text as='div' className={transactionType}>
                          {Number(transaction.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </div>
                    </Flex>
                  </Card>
                </Box>
              </Dialog.Trigger>
            </div>
          )
        })}
      </div>

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
            <Text><strong>Date:</strong> {new Date(selectedTransaction.date).toLocaleString()}</Text>
          </Box>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
