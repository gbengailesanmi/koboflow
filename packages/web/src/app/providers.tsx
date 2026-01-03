'use client'

import ThemeProviders from '@/providers/theme-providers'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviders>
      <SessionTimeoutProvider>
        {children}
      </SessionTimeoutProvider>
    </ThemeProviders>
  )
}
