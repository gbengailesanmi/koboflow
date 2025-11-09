'use client'

import SidebarNav from '@/app/components/sidebar/sidebar-nav/sidebar-nav'
import styles from './sidebar.module.css'

type SidebarProps = {
  customerId: string
  children: React.ReactNode
}

export default function Sidebar({ customerId, children }: SidebarProps) {
  return (
    <div className={styles.layout}>
      <SidebarNav customerId={customerId} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
