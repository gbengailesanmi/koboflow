import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Heading, Text } from '@radix-ui/themes'
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
          <Heading as="h2" size="4" mb="1">{title}</Heading>
          <Text size="2" color="gray">{description}</Text>
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
