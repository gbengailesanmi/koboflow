import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import styles from './analytics-card.module.css'

type AnalyticsCardProps = {
  title: string
  description: string
  children: React.ReactNode
  showNavigation?: boolean
  onNextChart?: () => void
  onPrevChart?: () => void
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ 
  title, 
  description, 
  children,
  showNavigation = false,
  onNextChart,
  onPrevChart
}) => {
  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          <p className={styles.cardDescription}>{description}</p>
        </div>
        <div className={styles.cardContent}>
          {children}
        </div>
      </div>
      
      {showNavigation && (onPrevChart || onNextChart) && (
        <div className={styles.navigationChevrons}>
          {onPrevChart && (
            <button 
              className={styles.chevronButton}
              onClick={onPrevChart}
              aria-label="Previous chart"
            >
              <ChevronLeftIcon />
            </button>
          )}
          {onNextChart && (
            <button 
              className={styles.chevronButton}
              onClick={onNextChart}
              aria-label="Next chart"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
