import React from 'react'
import styles from './header.module.css'
import { useParams, useRouter } from 'next/navigation'
import { GearIcon, ArrowLeftIcon, BellIcon } from '@radix-ui/react-icons'
import { Heading, Text } from '@radix-ui/themes'
import HamburgerMenu from '@/app/components/hamburger-menu/hamburger-menu'

type HeaderIconButtonProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  ariaLabel?: string
}

export function HeaderIconButton({ children, className, onClick, ariaLabel }: HeaderIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full bg-transparent hover:bg-gray-100/10 transition-colors cursor-pointer border-none ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

type DashboardHeaderProps = {
  variant?: 'dashboard' | 'default'
  title?: string
  subtitle?: string
}

export default function Header({ variant = 'default', title, subtitle }: DashboardHeaderProps) {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  const handleSettingsClick = () => {
    router.push(`/${customerId}/settings`)
  }

  const handleBack = () => {
    router.back()
  }

  if (variant === 'dashboard') {
    return (
      <div className={styles.dashboardHeaderWrapper}>
        {/* Left: Settings Gear */}
        <HeaderIconButton onClick={handleSettingsClick} ariaLabel="Settings">
          <GearIcon width="24" height="24" />
        </HeaderIconButton>

        {/* Right: Bell Icon (Notifications) */}
        <HeaderIconButton ariaLabel="Notifications">
          <BellIcon width="24" height="24" />
        </HeaderIconButton>
      </div>
    )
  }

  // Default variant for other pages (budget, analytics, settings, transactions)
  return (
    <>
      <div className={styles.headerWrapper}>
        {/* Left: Back Button */}
        <HeaderIconButton onClick={handleBack} ariaLabel="Go back">
          <ArrowLeftIcon width="24" height="24" />
        </HeaderIconButton>

        {/* Right: Hamburger Menu */}
        <div className={styles.hamburgerWrapper}>
          <HamburgerMenu customerId={customerId} />
        </div>
      </div>

      {/* Title and Subtitle Section */}
      {title && (
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
      )}
    </>
  )
}
