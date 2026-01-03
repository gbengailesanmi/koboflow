'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useState } from 'react'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'

type PageTitleContextType = {
  title?: string
  subtitle?: string
  setPageTitle: (title?: string, subtitle?: string) => void
}

export const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

export function usePageTitle() {
  const context = useContext(PageTitleContext)
  if (!context) {
    throw new Error('usePageTitle must be used within HeaderFooterProvider')
  }
  return context
}

export default function HeaderFooterProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [title, setTitle] = useState<string | undefined>()
  const [subtitle, setSubtitle] = useState<string | undefined>()

  const setPageTitle = (newTitle?: string, newSubtitle?: string) => {
    setTitle(newTitle)
    setSubtitle(newSubtitle)
  }

  const isDashboard = pathname?.includes('/dashboard') || pathname?.split('/').length === 2

  const noLayoutPages = ['/login', '/signin', '/verify-email']
  const shouldHideLayout = noLayoutPages.some(page => pathname?.startsWith(page))

  return (
    <PageTitleContext.Provider value={{ title, subtitle, setPageTitle }}>
      <>
        {!shouldHideLayout && (
          <Header variant={isDashboard ? 'dashboard' : 'default'} title={title} subtitle={subtitle} />
        )}
        {children}
        {!shouldHideLayout && <Footer />}
      </>
    </PageTitleContext.Provider>
  )
}