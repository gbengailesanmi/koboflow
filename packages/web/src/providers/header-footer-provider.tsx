'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useRef } from 'react'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'

type HeaderFooterContextType = {
  scrollContainerRef: React.RefObject<HTMLElement | null>
  setScrollContainer: (element: HTMLElement | null) => void
}

export const HeaderFooterContext = createContext<HeaderFooterContextType | undefined>(undefined)

export function useHeaderFooterContext() {
  const context = useContext(HeaderFooterContext)
  if (!context) {
    throw new Error('useHeaderFooterContext must be used within HeaderFooterProvider')
  }
  return context
}

export default function HeaderFooterProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  const setScrollContainer = (element: HTMLElement | null) => {
    scrollContainerRef.current = element
  }

  const isDashboard = pathname?.includes('/dashboard') || pathname?.split('/').length === 2
  const noLayoutPages = ['/login', '/signin', '/verify-email']
  const shouldHideLayout = noLayoutPages.some(page => pathname?.startsWith(page))

  return (
    <HeaderFooterContext.Provider value={{ scrollContainerRef, setScrollContainer }}>
      <>
        {!shouldHideLayout && isDashboard && (
          <Header variant="dashboard" />
        )}
        {children}
        {!shouldHideLayout && <Footer scrollContainerRef={scrollContainerRef} />}
      </>
    </HeaderFooterContext.Provider>
  )
}