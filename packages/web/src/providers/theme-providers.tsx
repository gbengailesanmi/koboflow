'use client'

import { ThemeProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'

export default function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="money-mapper-theme"
    >
      <Theme appearance="inherit">
        {children}
      </Theme>
    </ThemeProvider>
  )
}
