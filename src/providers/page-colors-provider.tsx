'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

type PageColors = {
  analytics: string
  budget: string
  profile: string
  settings: string
  transactions: string
  dashboard: string
}

type PageColorsContextType = {
  pageColors: PageColors | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const PageColorsContext = createContext<PageColorsContextType | undefined>(undefined)

export function PageColorsProvider({ children }: { children: ReactNode }) {
  const [pageColors, setPageColors] = useState<PageColors | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPageColors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/page-colors')
      if (response.ok) {
        const data = await response.json()
        setPageColors(data.pageColors)
      } else {
        // Fallback to defaults if API fails
        setPageColors({
          analytics: PAGE_COLORS.analytics + '4D',
          budget: PAGE_COLORS.budget + '4D',
          profile: PAGE_COLORS.profile + '4D',
          settings: PAGE_COLORS.settings + '4D',
          transactions: PAGE_COLORS.transactions + '4D',
          dashboard: PAGE_COLORS.dashboard + '4D',
        })
      }
    } catch (error) {
      console.error('Error fetching page colors:', error)
      // Fallback to defaults
      setPageColors({
        analytics: PAGE_COLORS.analytics + '4D',
        budget: PAGE_COLORS.budget + '4D',
        profile: PAGE_COLORS.profile + '4D',
        settings: PAGE_COLORS.settings + '4D',
        transactions: PAGE_COLORS.transactions + '4D',
        dashboard: PAGE_COLORS.dashboard + '4D',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPageColors()
  }, [])

  return (
    <PageColorsContext.Provider value={{ pageColors, isLoading, refetch: fetchPageColors }}>
      {children}
    </PageColorsContext.Provider>
  )
}

export function usePageColors() {
  const context = useContext(PageColorsContext)
  if (context === undefined) {
    throw new Error('usePageColors must be used within a PageColorsProvider')
  }
  return context
}
