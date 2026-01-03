'use client'

import { ReactNode } from 'react'
import { Box, Text, Card } from '@radix-ui/themes'
import { 
  PersonIcon, 
  EnvelopeClosedIcon,
  MobileIcon,
  HomeIcon,
  CalendarIcon,
  IdCardIcon,
} from '@radix-ui/react-icons'
import type { CustomerDetailsFromMono } from '@money-mapper/shared'
import styles from './user-info-card.module.css'

type UserInfoField = {
  label: string
  value: string
  icon: ReactNode
  fullWidth?: boolean
}

type UserInfoCardProps = {
  title: string
  subtitle?: string
  customerDetailsFromMono: CustomerDetailsFromMono
  className?: string
}

export function UserInfoCard({
  title,
  subtitle,
  customerDetailsFromMono,
  className,
}: UserInfoCardProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatAddress = () => {
    const parts = [
      customerDetailsFromMono.address_line1,
      customerDetailsFromMono.address_line2
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  const formatText = (value?: string | null) => {
    if (!value) return '—'
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  const fields: UserInfoField[] = [
    {
      label: 'Full Name',
      value: customerDetailsFromMono.full_name || '—',
      icon: <PersonIcon className={styles.icon} />,
    },
    {
      label: 'Phone Number',
      value: customerDetailsFromMono.phone || '—',
      icon: <MobileIcon className={styles.icon} />,
    },
    {
      label: 'BVN',
      value: customerDetailsFromMono.bvn || '—',
      icon: <IdCardIcon className={styles.icon} />,
    },
    {
      label: 'Date of Birth',
      value: formatDate(customerDetailsFromMono.dob),
      icon: <CalendarIcon className={styles.icon} />,
    },
    {
      label: 'Gender',
      value: formatText(customerDetailsFromMono.gender),
      icon: <PersonIcon className={styles.icon} />,
    },
    {
      label: 'Marital Status',
      value: formatText(customerDetailsFromMono.marital_status),
      icon: <PersonIcon className={styles.icon} />,
    },
    {
      label: 'Address',
      value: formatAddress(),
      icon: <HomeIcon className={styles.icon} />,
      fullWidth: true,
    },
  ]

  return (
    <Card className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <Text size="5" weight="bold">{title}</Text>
        {subtitle && (
          <Text size="2" color="gray">
            {subtitle}
          </Text>
        )}
      </div>

      <div className={styles.grid}>
        {fields.map((field, index) => (
          <Box 
            key={index} 
            className={styles.field}
            style={field.fullWidth ? { gridColumn: '1 / -1' } : undefined}
          >
            <Text as="label" size="2" weight="medium" className={styles.label}>
              {field.icon}
              {field.label}
            </Text>
            <div className={styles.value}>
              <Text className={styles.valueText}>
                {field.value}
              </Text>
            </div>
          </Box>
        ))}
      </div>
    </Card>
  )
}
