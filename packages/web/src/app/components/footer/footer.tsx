'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './Footer.module.css'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

interface FooterProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export default function Footer({ scrollContainerRef }: FooterProps) {
  const params = useParams()
  const pathname = usePathname()
  const customerId = params.customerId as string
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current || window
    
    const handleScroll = () => {
      const currentScrollY = scrollContainerRef?.current 
        ? scrollContainerRef.current.scrollTop 
        : window.scrollY

      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollYRef.current) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollYRef.current) {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [scrollContainerRef?.current])

  return (
    <div 
      className={`${styles.Footer} ${isVisible ? styles.FooterVisible : styles.FooterHidden}`}
    >
      <Link href={`/${customerId}/dashboard`}>
        <FooterIconButton 
          text='Home' 
          isActive={pathname?.includes('/dashboard')}
        >
          <HomeIcon width='25' height='25' />
        </FooterIconButton>
      </Link>
      
      <Link href={`/${customerId}/analytics`}>
        <FooterIconButton 
          text='Insights' 
          isActive={pathname?.includes('/analytics')}
        >
          <Pencil2Icon width='25' height='25' />
        </FooterIconButton>
      </Link>
      
      <Link href={`/${customerId}/budget`}>
        <FooterIconButton 
          text='Budget' 
          isActive={pathname?.includes('/budget')}
        >
          <MixerHorizontalIcon width='25' height='25' />
        </FooterIconButton>
      </Link>
      
      <Link href={`/${customerId}/dashboard`}>
        <FooterIconButton 
          text='Deals' 
          isActive={pathname?.includes('/deals')}
        >
          <BackpackIcon width='25' height='25' />
        </FooterIconButton>
      </Link>
    </div>
  )
}

type FooterIconButtonProps = {
  text?: string
  children: React.ReactNode
  isActive?: boolean
}

export function FooterIconButton({ text = '', children, isActive }: FooterIconButtonProps) {
  return (
    <div className={styles.FooterIconButtonContainer}>
      <button
        className={`${styles.FooterIconButton} ${isActive ? styles.FooterIconButtonActive : styles.FooterIconButtonInactive}`}
      >
        {children}
      </button>
      {text && (
        <div 
          className={`${styles.FooterIconText} ${isActive ? styles.FooterIconButtonActive : styles.FooterIconButtonInactive}`}
        >
          {text}
        </div>
      )}
    </div>
  )
}
