'use client'

import React, { ReactNode } from 'react'
import styles from './page-layout.module.css'

type PageLayoutProps = {
  stickySection?: ReactNode
  children: ReactNode
  className?: string
}

export function PageLayout({
  stickySection,
  children,
  className = ''
}: PageLayoutProps) {
  const mainRef = React.useRef<HTMLElement>(null)

  return (
    <div className={className}>
      <div className={styles.container}>

        {/* Content Container - wraps sticky section and scrollable body */}
        <div className={styles.contentContainer}>
          {/* Sticky Section (optional) */}
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
