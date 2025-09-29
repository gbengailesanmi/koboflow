import React from 'react'
import styles from './Footer.module.css'
import { redirect, useParams } from 'next/navigation'
import { IconButton } from '@radix-ui/themes'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

interface FooterProps {
  buttonColor?: string
}

export default function Footer({ buttonColor }: FooterProps) {
  const params = useParams()
  const customerId = params.customerId as string

  const handleHomeClick = () => {
    redirect(`/${customerId}/dashboard`)
  }

  const buttonStyle = buttonColor 
    ? { color: buttonColor }
    : {}

  return (
    <div className={styles.Footer}>
      <FooterIconButton 
        onClick={handleHomeClick} 
        text='Home' 
        style={buttonStyle}
        textColor={buttonColor}
      >
        <HomeIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Spending' style={buttonStyle} textColor={buttonColor}>
        <Pencil2Icon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Budget' style={buttonStyle} textColor={buttonColor}>
        <MixerHorizontalIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Deals' style={buttonStyle} textColor={buttonColor}>
        <BackpackIcon width='25' height='25' />
      </FooterIconButton>
    </div>
  )
}

type FooterIconButtonProps = React.ComponentProps<typeof IconButton> & {
  text?: string
  children: React.ReactNode
  textColor?: string
}

export function FooterIconButton({ text = '', children, textColor, ...props }: FooterIconButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <IconButton
        variant="ghost"
        size="4"
        radius="full"
        highContrast
        color="gray"
        {...props}
      >
        {children}
      </IconButton>
      {text && (
        <div 
          className="text-xs text-center" 
          style={textColor ? { color: textColor } : {}}
        >
          {text}
        </div>
      )}
    </div>
  )
}
