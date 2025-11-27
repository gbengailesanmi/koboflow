'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'

export default function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Theme>{children}</Theme>
    </ThemeProvider>
  )
}
