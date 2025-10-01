import { Box, Card, Flex, Text, Dialog } from '@radix-ui/themes'
import React from 'react'
import styles from './transaction-card.module.css'

type TransactionCardProps = {
  transaction: any
  isDebit: boolean
  amountClass: string
  Icon: React.ElementType
  onClick: () => void
  cardRef?: (el: HTMLDivElement | null) => void
}

export default function TransactionCard({
  transaction,
  isDebit,
  amountClass,
  Icon,
  onClick,
  cardRef,
}: TransactionCardProps) {
  return (
    <div
      className={styles.BoxWrapper}
      ref={cardRef}
    >
      <Dialog.Trigger onClick={onClick}>
        <Box className={styles.CardWrapper}>
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
}