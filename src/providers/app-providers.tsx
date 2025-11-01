'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'
import BaseColorProvider from '@/providers/base-colour-provider'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BaseColorProvider>
        <SessionTimeoutProvider>
          <Theme>{children}</Theme>
        </SessionTimeoutProvider>
      </BaseColorProvider>
    </ThemeProvider>
  )
}
