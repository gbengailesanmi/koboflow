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
      <FooterIconButton onClick={handleHomeClick}>
        <HomeIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick}>
        <Pencil2Icon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick}>
        <MixerHorizontalIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick}>
        <BackpackIcon width='25' height='25' />
      </FooterIconButton>
    </div>
  )
}

export function FooterIconButton(props: React.ComponentProps<typeof IconButton>) {
  return (
    <IconButton
      variant="outline"
      size="4"
      color="gray"
      radius="full"
      highContrast
      {...props}
    />
  )
}
