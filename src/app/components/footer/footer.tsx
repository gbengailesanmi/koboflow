import React from 'react'
import styles from './Footer.module.css'
import { useParams, useRouter } from 'next/navigation'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

interface FooterProps {
  buttonColor?: string
}

export default function Footer({ buttonColor }: FooterProps) {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  const handleHomeClick = () => {
    router.push(`/${customerId}/dashboard`)
  }

  const handleSpendingClick = () => {
    router.push(`/${customerId}/analytics`)
  }

  const handleBudgetClick = () => {
    router.push(`/${customerId}/budget`)
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
      <FooterIconButton onClick={handleSpendingClick} text='Spending' style={buttonStyle} textColor={buttonColor}>
        <Pencil2Icon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleBudgetClick} text='Budget' style={buttonStyle} textColor={buttonColor}>
        <MixerHorizontalIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleHomeClick} text='Deals' style={buttonStyle} textColor={buttonColor}>
        <BackpackIcon width='25' height='25' />
      </FooterIconButton>
    </div>
  )
}

type FooterIconButtonProps = {
  text?: string
  children: React.ReactNode
  textColor?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function FooterIconButton({ text = '', children, textColor, onClick, style }: FooterIconButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        style={style}
        className="p-3 rounded-full bg-transparent hover:bg-gray-100/10 transition-colors cursor-pointer border-none"
      >
        {children}
      </button>
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
