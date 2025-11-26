'use client'

import styles from './sidebar.module.css'

type SidebarProps = {
  customerId: string
  children: React.ReactNode
}

export default function Sidebar({ customerId, children }: SidebarProps) {
  return (
    <div className={styles.layout}>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
