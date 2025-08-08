import * as Styled from './styles'
import type { Transaction } from '@/types/transactions'
import { Box, Card, Flex, Text, Dialog, Button } from '@radix-ui/themes'
import { DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

type TrxnRowProps = {
  transactions: Transaction[]
}

export default function TransactionsColumn({ transactions }: TrxnRowProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  return (
    <Dialog.Root
      onOpenChange={open => {
        if (!open) setSelectedTransaction(null)
      }}
    >
      <Styled.TransactionsWrapper>
        {transactions.map(transaction => {
          const isDebit = Number(transaction.amount) < 0
          const amountColor = isDebit ? 'red' : 'green'
          const Icon = isDebit ? UploadIcon : DownloadIcon

          return (
            <Styled.BoxWrapper key={transaction.id}>
              <Dialog.Trigger
                onClick={() => setSelectedTransaction(transaction)}
              >
                <Box width="100%" style={{ cursor: 'pointer' }}>
                  <Card>
                    <Flex gap="3" align="center">
                      <Icon />
                      <Box>
                        <Text as="div" size="2">
                          {isDebit ? 'Sent money' : 'Received money'}
                        </Text>
                        <Text as="div" size="2" weight="bold">
                          {transaction.narration}
                        </Text>
                        <Text as="div" size="1">
                          {new Date(transaction.bookedDate).toISOString().slice(0, 10)}
                        </Text>
                      </Box>
                      <Flex align="center" justify="end" style={{ flex: 1 }}>
                        <Text as="div" size="3" weight="bold" color={amountColor}>
                          {transaction.amount}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                </Box>
              </Dialog.Trigger>
            </Styled.BoxWrapper>
          )
        })}
      </Styled.TransactionsWrapper>

      {selectedTransaction && (
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Transaction Details</Dialog.Title>
          <Box>
            <Text><strong>ID:</strong> {selectedTransaction.id}</Text>
            <Text><strong>Amount:</strong> {selectedTransaction.amount}</Text>
            <Text><strong>Narration:</strong> {selectedTransaction.narration}</Text>
            <Text><strong>Booked Date:</strong> {new Date(selectedTransaction.bookedDate).toLocaleString()}</Text>
            {/* Add more fields here */}
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Close</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
