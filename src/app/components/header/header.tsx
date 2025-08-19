import React from 'react'
import styles from './Header.module.css'
import { redirect, useParams } from 'next/navigation'
import { IconButton } from '@radix-ui/themes'
import { PersonIcon, GearIcon } from '@radix-ui/react-icons'

export default function Header() {
  const params = useParams()
  const customerId = params.customerId as string

  
  const handleProfileClick = () => {
    redirect(`/${customerId}/profileSettings`)
  }

  // const handlePencilClick = () => {



  return (
    <div className={styles.HeaderWrapper}>
      <HeaderIconButton className={styles.SettingsButton} onClick={handleProfileClick}>
        <PersonIcon width='25' height='25' />
      </HeaderIconButton>
      <HeaderIconButton className={styles.SettingsButton} onClick={handleProfileClick}>
        <GearIcon width='25' height='25' />
      </HeaderIconButton>
    </div>
  )
}

type FooterIconButtonProps = React.ComponentProps<typeof IconButton> & {
  children: React.ReactNode
}

export function HeaderIconButton({ children, ...props }: FooterIconButtonProps) {
  return (
    <IconButton
      variant="ghost"
      size="3"
      color="gray"
      radius="full"
      highContrast
      {...props}
    >
      {children}
    </IconButton>
  )
}
