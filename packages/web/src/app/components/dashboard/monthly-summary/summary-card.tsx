'use client'

import React from 'react'
import styles from './summary-card.module.css'

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: React.ReactNode
  onClick?: () => void
  clickable?: boolean
  vsContent?: React.ReactNode
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  onClick,
  clickable = false,
  vsContent
}: SummaryCardProps) {
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
        {vsContent && <div className={styles.bottomSection}>{vsContent}</div>}
      </div>
      {clickable && <p className={styles.clickText}>Click to see details</p>}
    </div>
  )
}
