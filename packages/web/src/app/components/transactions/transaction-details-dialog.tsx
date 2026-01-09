import { Dialog, Flex, Box, Text } from '@radix-ui/themes'
import { Cross1Icon } from '@radix-ui/react-icons'
import type { EnrichedTransaction } from '@koboflow/shared'

type Props = {
  transaction: EnrichedTransaction
  onClose: () => void
}

export default function TransactionDetailsDialog({ transaction, onClose }: Props) {
  if (!transaction) return null

  return (
    <Dialog.Content>
      <Flex gap="3" justify="between" style={{ marginBottom: '1rem' }}>
        <Dialog.Title>Transaction Details</Dialog.Title>
        <Dialog.Close onClick={onClose}>
          <Cross1Icon />
        </Dialog.Close>
      </Flex>
      <Box>
        <Text>
          <strong>ID:</strong> {transaction.id}
          <br />
        </Text>
        <Text>
          <strong>Amount:</strong> {transaction.amount}
        </Text>
        <Text>
          <strong>Narration:</strong> {transaction.narration}
          <br />
        </Text>
        <Text>
          <strong>Booked Date:</strong> {new Date(transaction.date).toLocaleString()}
        </Text>
      </Box>
    </Dialog.Content>
  )
}
