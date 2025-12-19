import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Footer.module.css'
import { useParams, usePathname } from 'next/navigation'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

interface FooterProps {
  buttonColor?: string
  opacity?: number // Opacity value from 0-100 (e.g., 2, 75, 100)
  scrollContainerRef?: React.RefObject<HTMLElement | null> // Optional custom scroll container
}

export default function Footer({ buttonColor, opacity = 75, scrollContainerRef }: FooterProps) {
  const params = useParams()
  const pathname = usePathname()
  const customerId = params.customerId as string
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = scrollContainerRef?.current 
        ? scrollContainerRef.current.scrollTop 
        : window.scrollY

      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    const scrollElement = scrollContainerRef?.current || window

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [lastScrollY, scrollContainerRef])

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
      <Link href={`/${customerId}/dashboard`} passHref legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <FooterIconButton 
            text='Home' 
            style={buttonStyle}
            textColor={buttonColor}
            isActive={pathname?.includes('/dashboard')}
          >
            <HomeIcon width='25' height='25' />
          </FooterIconButton>
        </a>
      </Link>
      
      <Link href={`/${customerId}/analytics`} passHref legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <FooterIconButton 
            text='Insights' 
            style={buttonStyle} 
            textColor={buttonColor}
            isActive={pathname?.includes('/analytics')}
          >
            <Pencil2Icon width='25' height='25' />
          </FooterIconButton>
        </a>
      </Link>
      
      <Link href={`/${customerId}/budget`} passHref legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <FooterIconButton 
            text='Budget' 
            style={buttonStyle} 
            textColor={buttonColor}
            isActive={pathname?.includes('/budget')}
          >
            <MixerHorizontalIcon width='25' height='25' />
          </FooterIconButton>
        </a>
      </Link>
      
      <Link href={`/${customerId}/dashboard`} passHref legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <FooterIconButton 
            text='Deals' 
            style={buttonStyle} 
            textColor={buttonColor}
            isActive={pathname?.includes('/deals')}
          >
            <BackpackIcon width='25' height='25' />
          </FooterIconButton>
        </a>
      </Link>
    </div>
  )
}

type FooterIconButtonProps = {
  text?: string
  children: React.ReactNode
  textColor?: string
  onClick?: () => void
  style?: React.CSSProperties
  isActive?: boolean
}

export function FooterIconButton({ text = '', children, textColor, onClick, style, isActive }: FooterIconButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        style={style}
        className={`p-3 rounded-full bg-transparent hover:bg-gray-100/10 transition-colors cursor-pointer border-none ${isActive ? 'opacity-100' : 'opacity-60'}`}
      >
        {children}
      </button>
      {text && (
        <div 
          className="text-xs text-center" 
          style={textColor ? { color: textColor, opacity: isActive ? 1 : 0.6 } : { opacity: isActive ? 1 : 0.6 }}
        >
          {text}
        </div>
      )}
    </div>
  )
}
