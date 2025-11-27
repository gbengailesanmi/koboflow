'use client'

import React from 'react'
import { ArrowLeftIcon, MixerVerticalIcon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Heading, Text } from '@radix-ui/themes'
import { useRouter, useParams } from 'next/navigation'
import HamburgerMenu from '@/app/components/hamburger-menu/hamburger-menu'
import styles from './page-header.module.css'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
  showOptionsIcon?: boolean
  onOptionsClick?: () => void
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle,
  backTo,
  showOptionsIcon = false,
  onOptionsClick
}) => {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string
  
  const handleBack = () => {
    if (backTo) {
      router.push(backTo)
    } else {
      router.back()
    }
  }

  return (
    <>
      <div className={styles.header}>
        {/* Back Button - Far Left */}
        <button 
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Go back"
        >
          <ArrowLeftIcon width="20" height="20" />
        </button>

        {/* Right Icons - Far Right */}
        <div className={styles.rightIcons}>
          {showOptionsIcon && onOptionsClick && (
            <button
              onClick={onOptionsClick}
              className={styles.optionsButton}
              aria-label="Options"
            >
              <MixerVerticalIcon width="20" height="20" />
            </button>
          )}
          <div className={styles.hamburgerWrapper}>
            <HamburgerMenu customerId={customerId} />
          </div>
        </div>
      </div>
      
      {/* Title and Subtitle - Left Aligned */}
      <div className={styles.titleSection}>
        <Heading as="h1" size="8" weight="bold" mb="2">
          {title}
        </Heading>
        {subtitle && (
          <Text size="3" color="gray">
            {subtitle}
          </Text>
        )}
      </div>
    </>
  )
}
