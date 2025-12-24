import React from 'react'
import styles from './empty-state.module.css'

type EmptyStateProps = {
  icon: string
  title: string
  description: string
  className?: string
}

export function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.emptyStateContent}>
        <div className={styles.emptyStateIcon}>{icon}</div>
        <h3 className={styles.emptyStateTitle}>{title}</h3>
        <p className={styles.emptyStateText}>{description}</p>
      </div>
    </div>
  )
}
