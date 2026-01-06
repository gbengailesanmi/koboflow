'use client'

import React, { ReactNode } from 'react'
import { Grid } from '@radix-ui/themes'
import { Separator } from '@radix-ui/themes'
import styles from './card.module.css'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'summary'
}

export default function Card({
  title,
  children,
  variant = 'default',
}: CardProps) {
  return (
    <Grid className={`${styles.card}`}>
      <h2>{title}</h2>
      <Separator mb='5' size='4' />
      <div className={`${styles[variant]}`}>{children}</div>
    </Grid>
  )
}
