'use client'

import React, { ReactNode, useEffect } from 'react'
import styles from './page-layout.module.css'
import Header from '@/app/components/header/header'
import { useHeaderFooterContext } from '@/providers/header-footer-provider'

type PageLayoutProps = {
  title?: string
  subtitle?: string
  headerVariant?: 'default' | 'dashboard'
  stickySection?: ReactNode
  children: ReactNode
  className?: string
}

export function PageLayout({
  title,
  subtitle,
  headerVariant = 'default',
  stickySection,
  children,
  className = ''
}: PageLayoutProps) {
  const mainRef = React.useRef<HTMLElement>(null)
  const { setScrollContainer } = useHeaderFooterContext()

  useEffect(() => {
    if (mainRef.current) {
      setScrollContainer(mainRef.current)
    }

    return () => {
      setScrollContainer(null)
    }
  }, [setScrollContainer])

  return (
    <div className={className}>
      <Header variant={headerVariant} title={title} subtitle={subtitle} />
      
      <div className={styles.container}>
        <div className={styles.contentContainer}>
          {stickySection && (
            <div className={styles.stickySection}>
              {stickySection}
            </div>
          )}
          <main ref={mainRef} className='page-main'>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
