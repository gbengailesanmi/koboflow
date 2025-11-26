import React from 'react'
import styles from './Header.module.css'
import { useParams, useRouter } from 'next/navigation'
import { PersonIcon, GearIcon } from '@radix-ui/react-icons'

export default function Header() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  
  const handleProfileClick = () => {
    router.push(`/${customerId}/profile`)
  }

  const handleSettingsClick = () => {
    router.push(`/${customerId}/settings`)
  }

  return (
    <div className={styles.HeaderWrapper}>
      <HeaderIconButton className={styles.SettingsButton} onClick={handleProfileClick}>
        <PersonIcon width='25' height='25' />
      </HeaderIconButton>
      <HeaderIconButton className={styles.SettingsButton} onClick={handleSettingsClick}>
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
