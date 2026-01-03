'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Text, IconButton } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import styles from './detail-page.module.css'

type DetailItem = {
  label: string
  value: string | ReactNode
  icon?: ReactNode
}

type DetailPageProps = {
  title: string
  subtitle?: string
  items: DetailItem[]
  onClose?: () => void
  footer?: ReactNode
  customerId?: string
}

export function DetailPage({
  title,
  subtitle,
  items,
  onClose,
  footer,
  customerId,
}: DetailPageProps) {
  const router = useRouter()

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (customerId) {
      router.push(`/${customerId}/settings`)
    } else {
      router.back()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Flex direction="column" gap="1">
          <Text size="6" weight="bold">
            {title}
          </Text>
          {subtitle && (
            <Text size="2" color="gray">
              {subtitle}
            </Text>
          )}
        </Flex>
        <IconButton
          variant="ghost"
          size="3"
          onClick={handleClose}
          className={styles.closeButton}
        >
          <Cross2Icon width="20" height="20" />
        </IconButton>
      </div>

      <div className={styles.content}>
        {items.map((item, index) => (
          <Box key={index} className={styles.detailItem}>
            <Flex align="center" gap="2" mb="1">
              {item.icon}
              <Text size="2" weight="medium" color="gray">
                {item.label}
              </Text>
            </Flex>
            <div className={styles.detailValue}>
              {typeof item.value === 'string' ? (
                <Text size="3" weight="regular">
                  {item.value || '—'}
                </Text>
              ) : (
                item.value
              )}
            </div>
          </Box>
        ))}
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
