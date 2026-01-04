'use client'

import React, { ReactNode } from 'react'
import { Grid } from '@radix-ui/themes'
import styles from './card.module.css'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
}

export default function Card({
  title,
  children,
  className = ''
}: CardProps) {
  return (
    <Grid className={`${styles.card} ${className}`}>
      <h2>{title}</h2>
      {children}
    </Grid>
  )
}
