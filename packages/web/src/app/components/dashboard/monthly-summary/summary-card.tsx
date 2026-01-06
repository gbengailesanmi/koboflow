'use client'

import React from 'react'
import { TriangleDownIcon } from '@radix-ui/react-icons'
import styles from './summary-card.module.css'

interface VsContentObject {
  amount: string
  lastMonth: string
  isLower: boolean
}

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: React.ReactNode
  onClick?: () => void
  clickable?: boolean
  vsContent?: VsContentObject
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  onClick,
  clickable = false,
  vsContent
}: SummaryCardProps) {
  const iconColor = vsContent?.isLower ? styles.iconGreen : styles.iconRed

  return (
    <div
      className={`${styles.card} ${clickable ? styles.clickable : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className={styles.content}>
        <div className={styles.topSection}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {vsContent && (
          <div className={styles.bottomSection}>
            <div className={styles.vsAmount}>
              <TriangleDownIcon width={15} height={15} className={iconColor} />
              {vsContent.amount}
            </div>
            <div className={styles.vsLastMonth}>vs {vsContent.lastMonth}</div>
          </div>
        )}
      </div>
      {clickable && <p className={styles.clickText}>Click to see details</p>}
    </div>
  )
}
