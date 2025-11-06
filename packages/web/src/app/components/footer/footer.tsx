import React, { useState, useEffect } from 'react'
import styles from './Footer.module.css'
import { useParams, useRouter } from 'next/navigation'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

interface FooterProps {
  buttonColor?: string
  opacity?: number // Opacity value from 0-100 (e.g., 2, 75, 100)
}

export default function Footer({ buttonColor, opacity = 75 }: FooterProps) {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

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

  const footerStyle = {
    backgroundColor: `rgba(255, 255, 255, ${opacity / 100})`
  }

  return (
    <div 
      className={`${styles.Footer} ${isVisible ? styles.FooterVisible : styles.FooterHidden}`}
      style={footerStyle}
    >
      <FooterIconButton 
        onClick={handleHomeClick} 
        text='Home' 
        style={buttonStyle}
        textColor={buttonColor}
      >
        <HomeIcon width='25' height='25' />
      </FooterIconButton>
      <FooterIconButton onClick={handleSpendingClick} text='Insights' style={buttonStyle} textColor={buttonColor}>
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
