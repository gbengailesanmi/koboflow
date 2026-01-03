'use client'

import ThemeProviders from '@/providers/theme-providers'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'
import HeaderFooterProvider from '@/providers/header-footer-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviders>
      <SessionTimeoutProvider>
        <HeaderFooterProvider>
          {children}
        </HeaderFooterProvider>
      </SessionTimeoutProvider>
    </ThemeProviders>
  )
}
