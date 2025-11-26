import React from 'react'
import styles from './analytics-card.module.css'

type AnalyticsCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, description, children }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  )
}
