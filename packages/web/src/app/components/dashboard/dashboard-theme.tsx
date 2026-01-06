'use client'
import { Theme } from '@radix-ui/themes'

export default function DashboardThemeWrapper({children}: {children: React.ReactNode}) {
  return (
    <Theme className='dashboard-gradient-background'>
      {children}
    </Theme>
  )
}
