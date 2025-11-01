'use client'

import React from 'react'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useRouter, useParams } from 'next/navigation'
import styles from './page-header.module.css'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string // Optional custom back path, defaults to dashboard
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle,
  backTo 
}) => {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string
  
  const handleBack = () => {
    const destination = backTo || `/${customerId}/dashboard`
    router.push(destination)
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.backButton}>
          <ArrowLeftIcon
            className={styles.backIcon}
            onClick={handleBack}
            style={{ color: '#fff' }}
          />
        </div>
        <div className={styles.headerCenter}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      {subtitle && (
        <div className={styles.subtitle}>
          <p className={styles.subtitleText}>{subtitle}</p>
        </div>
      )}
    </>
  )
}
