'use client'

import React from 'react'
import { Dialog, Box, Text, Button, Flex } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import styles from './upcoming-bills-popup.module.css'

interface BillItem {
  id: string
  name: string
  amount: number
  dueDate: string
}

interface UpcomingBillsPopupProps {
  bills: BillItem[]
  onClose: () => void
}

export default function UpcomingBillsPopup({
  bills,
  onClose
}: UpcomingBillsPopupProps) {
  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content className={styles.dialogContent}>
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>Upcoming Bills</Dialog.Title>
          <Dialog.Close className={styles.closeButton} aria-label="Close">
            <Cross2Icon />
          </Dialog.Close>
        </Flex>

        <div className={styles.billsList}>
          {bills.length === 0 ? (
            <p className={styles.emptyState}>No upcoming bills</p>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className={styles.billItem}>
                <div className={styles.billDetails}>
                  <p className={styles.billName}>{bill.name}</p>
                  <p className={styles.billDueDate}>{bill.dueDate}</p>
                </div>
                <p className={styles.billAmount}>
                  £{bill.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
