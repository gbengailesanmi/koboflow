'use client'

import React, { createContext, useContext, useState } from 'react'
import { useDynamicBackground } from '@/hooks/use-dynamic-background'

interface DashboardBackgroundContextType {
  activeIndex: number
  setActiveIndex: (index: number) => void
}

const DashboardBackgroundContext = createContext<DashboardBackgroundContextType | undefined>(undefined)

export function useDashboardBackground() {
  const context = useContext(DashboardBackgroundContext)
  if (!context) {
    throw new Error('useDashboardBackground must be used within DashboardBackgroundProvider')
  }
  return context
}

interface DashboardBackgroundProviderProps {
  children: React.ReactNode
  colors: readonly string[]
}

export function DashboardBackgroundProvider({ children, colors }: DashboardBackgroundProviderProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Apply the dynamic background based on active index
  useDynamicBackground({ activeIndex, colors })

  return (
    <DashboardBackgroundContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div className="dashboard-gradient-background">
        {children}
      </div>
    </DashboardBackgroundContext.Provider>
  )
}
