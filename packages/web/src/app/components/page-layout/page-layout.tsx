'use client'

import React, { ReactNode } from 'react'
import Footer from '@/app/components/footer/footer'
import styles from './page-layout.module.css'

type PageLayoutProps = {
  /** Header section content - typically PageHeader component */
  header: ReactNode
  /** Sticky section content - stays fixed while body scrolls */
  stickySection?: ReactNode
  /** Main body content - scrollable */
  children: ReactNode
  /** Optional footer props */
  footer?: {
    buttonColor?: string
    opacity?: number
  }
  /** Optional CSS class for the container */
  className?: string
}

export function PageLayout({
  header,
  stickySection,
  children,
  className = ''
}: PageLayoutProps) {
  const mainRef = React.useRef<HTMLElement>(null)

  return (
    <div className={className}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          {header}
        </div>

        {/* Content Container - wraps sticky section and scrollable body */}
        <div className={styles.contentContainer}>
          {/* Sticky Section (optional) */}
          {stickySection && (
            <div className={styles.stickySection}>
              {stickySection}
            </div>
          )}

          {/* Main Scrollable Body */}
          <main ref={mainRef} className='page-main'>
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer scrollContainerRef={mainRef} />
    </div>
  )
}
