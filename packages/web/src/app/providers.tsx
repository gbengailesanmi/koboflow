'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import ThemeProviders from '@/providers/theme-providers'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'
import HeaderFooterProvider from '@/providers/header-footer-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProviders>
        <SessionTimeoutProvider>
          <HeaderFooterProvider>
            {children}
          </HeaderFooterProvider>
        </SessionTimeoutProvider>
      </ThemeProviders>
    </NuqsAdapter>
  )
}
