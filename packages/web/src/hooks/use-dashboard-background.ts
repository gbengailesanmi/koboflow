// hooks/use-dashboard-background.ts
'use client'

import { useEffect, useRef } from 'react'
import {
  DASHBOARD_SLIDE_COLORS,
  DEFAULT_SLIDE_COLOR,
} from '@money-mapper/shared'

export function useDashboardBackground(
  accountId: string | null
) {
  const lastColorRef = useRef<string | null>(null)

  useEffect(() => {
    const index =
      accountId
        ? Math.abs(hashString(accountId)) % DASHBOARD_SLIDE_COLORS.length
        : 0

    const nextColor =
      DASHBOARD_SLIDE_COLORS[index] ?? DEFAULT_SLIDE_COLOR

    if (lastColorRef.current === nextColor) return
    lastColorRef.current = nextColor

    document.documentElement.style.setProperty(
      '--dashboard-bg-color',
      nextColor
    )
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
