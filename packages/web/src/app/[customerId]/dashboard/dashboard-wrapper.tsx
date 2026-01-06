'use client'

import React from 'react'
import { DashboardBackgroundProvider } from '@/providers/dashboard-background-provider'
import { DASHBOARD_SLIDE_COLORS } from '@money-mapper/shared'

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DashboardBackgroundProvider colors={DASHBOARD_SLIDE_COLORS}>
      {children}
    </DashboardBackgroundProvider>
  )
}
