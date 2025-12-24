'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'

type ThemeProvidersProps = {
  children: React.ReactNode
  initialTheme?: string
}

export default function ThemeProviders({ children, initialTheme = 'system' }: ThemeProvidersProps) {
  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem
      disableTransitionOnChange
      storageKey="money-mapper-theme"
    >
      <Theme appearance='inherit'>
        {children}
      </Theme>
    </ThemeProvider>
  )
}
