'use client'

import React, { ReactNode } from 'react'
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
    <section className={`${styles.card}`}>
      <h2>{title}</h2>
      <Separator my='6' size='4' mx='auto' className='max-w-[85%]' />
      <div className={`${styles[variant]}`}>{children}</div>
    </section>
  )
}
