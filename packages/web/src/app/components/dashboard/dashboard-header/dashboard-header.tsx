import React from 'react'
import styles from './dashboard-header.module.css'
import { useParams, useRouter } from 'next/navigation'
import { GearIcon } from '@radix-ui/react-icons'

export default function Header() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  const handleSettingsClick = () => {
    router.push(`/${customerId}/settings`)
  }

  return (
    <div className={styles.dashboardHeaderWrapper}>
      <HeaderIconButton onClick={handleSettingsClick}>
        <GearIcon width='25' height='25' />
      </HeaderIconButton>
    </div>
  )
}

type HeaderIconButtonProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function HeaderIconButton({ children, className, onClick }: HeaderIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full bg-transparent hover:bg-gray-100/10 transition-colors cursor-pointer border-none ${className || ''}`}
    >
      {children}
    </button>
  )
}
