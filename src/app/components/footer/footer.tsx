import React from 'react'
import styles from './Footer.module.css'
import { redirect, useParams } from 'next/navigation'
import { IconButton } from '@radix-ui/themes'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

export default function Footer() {
  const params = useParams()
  const customerId = params.customerId as string

  
  const handleHomeClick = () => {
    redirect(`/${customerId}/dashboard`)
  }

  // const handlePencilClick = () => {



  return (
    <div className={styles.Footer}>
      <FooterIconButton onClick={handleHomeClick} text='Home'>
        <HomeIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Spending'>
        <Pencil2Icon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Budget'>
        <MixerHorizontalIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Deals'>
        <BackpackIcon width='25' height='25' />
      </FooterIconButton>
    </div>
  )
}

type FooterIconButtonProps = React.ComponentProps<typeof IconButton> & {
  text?: string
  children: React.ReactNode
}

export function FooterIconButton({ text = '', children, ...props }: FooterIconButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <IconButton
        variant="ghost"
        size="4"
        color="gray"
        radius="full"
        highContrast
        {...props}
      >
        {children}
      </IconButton>
      {text && <div className="text-xs text-center">{text}</div>}
    </div>
  )
}
