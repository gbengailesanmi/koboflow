import * as Styled from './styles'
import type { Transaction } from '@/types/transactions'
import { Box, Card, Flex, Text } from '@radix-ui/themes'
import { DownloadIcon, UploadIcon } from '@radix-ui/react-icons'


type TrxnRowProps = {
	transactions: Transaction[]
}

export default function TransactionsColumn({ transactions }: TrxnRowProps) {
  return (
    <Styled.TransactionsWrapper>
      {transactions.map(transaction => {
        const isDebit = Number(transaction.amount) < 0
        const amountColor = isDebit ? 'red' : 'green'
        const Icon = isDebit ? UploadIcon : DownloadIcon

        return (
          <Styled.BoxWrapper key={transaction.id}>
            <Box width="100%">
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
                      {transaction.bookedDate.toLocaleDateString()}
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
          </Styled.BoxWrapper>
        )
      })}
    </Styled.TransactionsWrapper>
  )
}
