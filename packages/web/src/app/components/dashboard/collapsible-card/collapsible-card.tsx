'use client'

import React, { ReactNode } from 'react'
import { Grid } from '@radix-ui/themes'
import { CaretDownIcon } from '@radix-ui/react-icons'
import styles from './collapsible-card.module.css'

interface CollapsibleCardProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
  headerClassName?: string
}

export default function CollapsibleCard({
  title,
  isExpanded,
  onToggle,
  children,
  className = '',
  headerClassName = ''
}: CollapsibleCardProps) {
  return (
    <Grid className={`${styles.card} ${className}`}>
      <div 
        className={`${styles.cardHeader} ${headerClassName}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <h2>{title}</h2>
        <CaretDownIcon 
          width={24}
          height={24}
          className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
        />
      </div>

      {isExpanded && children}
    </Grid>
  )
}
