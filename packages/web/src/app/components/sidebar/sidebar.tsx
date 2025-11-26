'use client'

import HamburgerMenu from '@/app/components/hamburger-menu/hamburger-menu'
import styles from './sidebar.module.css'

type SidebarProps = {
  customerId: string
  children: React.ReactNode
}

export default function Sidebar({ customerId, children }: SidebarProps) {
  return (
    <div className={styles.layout}>
      <HamburgerMenu customerId={customerId} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
