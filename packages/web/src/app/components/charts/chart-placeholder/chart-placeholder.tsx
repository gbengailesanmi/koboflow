import React from 'react'
import styles from './chart-placeholder.module.css'

type ChartPlaceholderProps = {
  icon: string
  message: string
  type?: 'no-data' | 'coming-soon'
  className?: string
}

export function ChartPlaceholder({ 
  icon, 
  message, 
  type = 'no-data',
  className = '' 
}: ChartPlaceholderProps) {
  const typeClass = type === 'coming-soon' ? styles.comingSoon : styles.noData
  
  return (
    <div className={`${styles.placeholder} ${typeClass} ${className}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.message}>{message}</div>
    </div>
  )
}
