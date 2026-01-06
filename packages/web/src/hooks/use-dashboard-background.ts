// hooks/use-dashboard-background.ts
'use client'

import { useEffect, useRef } from 'react'
import {
  DASHBOARD_SLIDE_COLORS,
  DEFAULT_SLIDE_COLOR,
} from '@money-mapper/shared'

export function useDashboardBackground(accountId: string | null) {
  const lastColorRef = useRef<string | null>(null)

  useEffect(() => {
    const updateDashboardColor = () => {
      const isDark = document.documentElement.classList.contains('dark')
      
      if (!isDark) {
        return
      }

      const dashboard =
        document.querySelector<HTMLElement>('[data-dashboard]')
      if (!dashboard) return

      const index = accountId
        ? Math.abs(hashString(accountId)) % DASHBOARD_SLIDE_COLORS.length
        : 0

      const nextColor =
        DASHBOARD_SLIDE_COLORS[index] ?? DEFAULT_SLIDE_COLOR

      if (lastColorRef.current === nextColor) return
      lastColorRef.current = nextColor

      dashboard.style.setProperty('--dashboard-bg-color', nextColor)
    }

    // Initial update
    updateDashboardColor()

    // Listen for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateDashboardColor()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      observer.disconnect()
      const dashboard =
        document.querySelector<HTMLElement>('[data-dashboard]')
      if (dashboard) {
        dashboard.style.removeProperty('--dashboard-bg-color')
      }
    }
  }, [accountId])
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}
