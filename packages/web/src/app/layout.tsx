import AppProviders from '@/providers/app-providers'
import { Open_Sans } from 'next/font/google'

import './globals.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin']
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable}>
      <body suppressHydrationWarning>
        <AppProviders>
          <div style={{ minHeight: '100vh', width: '100%' }}>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  )
}
