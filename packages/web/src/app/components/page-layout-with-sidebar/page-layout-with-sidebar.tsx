'use client'

import SidebarNav from '@/app/components/sidebar-nav/sidebar-nav'
import styles from './page-layout-with-sidebar.module.css'

type PageLayoutWithSidebarProps = {
  customerId: string
  children: React.ReactNode
}

export default function PageLayoutWithSidebar({ customerId, children }: PageLayoutWithSidebarProps) {
  return (
    <div className={styles.layout}>
      <SidebarNav customerId={customerId} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
