'use client'

import ThemeProviders from '@/providers/theme-providers'
// import SessionTimeoutProvider from '@/providers/session-timeout-provider'

export default function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: string
}) {
  return (
    <ThemeProviders initialTheme={initialTheme}>
      {/* <SessionTimeoutProvider> */}
        {children}
      {/* </SessionTimeoutProvider> */}
    </ThemeProviders>
  )
}
