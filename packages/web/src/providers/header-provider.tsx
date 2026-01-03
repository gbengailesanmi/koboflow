'use client'

import { usePathname } from 'next/navigation'
import { useContext } from 'react'
import Header from '@/app/components/header/header'
import { PageTitleContext } from '@/providers/page-title-context'

export default function HeaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const titleContext = useContext(PageTitleContext)

  // Determine if we're on the dashboard page
  const isDashboard = pathname?.includes('/dashboard') || pathname?.split('/').length === 2

  // Pages that shouldn't have the header
  const noHeaderPages = ['/login', '/signin', '/verify-email']
  const shouldHideHeader = noHeaderPages.some(page => pathname?.startsWith(page))

  return (
    <>
      {!shouldHideHeader && (
        <Header variant={isDashboard ? 'dashboard' : 'default'} title={titleContext?.title} subtitle={titleContext?.subtitle} />
      )}
      {children}
    </>
  )
}