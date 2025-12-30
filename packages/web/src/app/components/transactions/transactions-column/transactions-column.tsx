'use client'

import type { EnrichedTransaction } from '@money-mapper/shared'
import { Box, Card, Flex, Text, Dialog } from '@radix-ui/themes'
import { Cross1Icon, DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import styles from './transactions-column.module.css'
import { useState } from 'react'

type TrxnRowProps = {
  transactions: EnrichedTransaction[]
}

export default function TransactionsColumn({ transactions }: TrxnRowProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null)

  return (
    <Dialog.Root
      onOpenChange={open => {
        if (!open) setSelectedTransaction(null)
      }}
    >
      <div className={styles.TransactionsWrapper}>
        {transactions.map(transaction => {
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
                          {new Date(transaction.date).toISOString().slice(0, 10)}
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
            <Text><strong>Booked Date:</strong> {new Date(selectedTransaction.date).toLocaleString()}</Text>
          </Box>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
