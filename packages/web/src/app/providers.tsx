'use client'

import ThemeProviders from '@/providers/theme-providers'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'
import { PageTitleProvider } from '@/providers/page-title-context'
import HeaderProvider from '@/providers/header-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviders>
      <SessionTimeoutProvider>
        <PageTitleProvider>
          <HeaderProvider>
            {children}
          </HeaderProvider>
        </PageTitleProvider>
      </SessionTimeoutProvider>
    </ThemeProviders>
  )
}
