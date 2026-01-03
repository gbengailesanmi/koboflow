'use client'

import { createContext, useContext, useState } from 'react'

type PageTitleContextType = {
  title?: string
  subtitle?: string
  setPageTitle: (title?: string, subtitle?: string) => void
}

export const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | undefined>()
  const [subtitle, setSubtitle] = useState<string | undefined>()

  const setPageTitle = (newTitle?: string, newSubtitle?: string) => {
    setTitle(newTitle)
    setSubtitle(newSubtitle)
  }

  return (
    <PageTitleContext.Provider value={{ title, subtitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  const context = useContext(PageTitleContext)
  if (!context) {
    throw new Error('usePageTitle must be used within PageTitleProvider')
  }
  return context
}