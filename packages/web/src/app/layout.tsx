import ThemeProviders from '@/providers/theme-providers'
import { Open_Sans } from 'next/font/google'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'
import { getSettings } from '@/app/api/api-service'

import './globals.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin']
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch user's theme preference from database (if logged in)
  const settings = await getSettings()
  const userTheme = settings?.appearance?.theme || 'system'

  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProviders initialTheme={userTheme}>
            <SessionTimeoutProvider>
              <div style={{ minHeight: '100vh', width: '100%' }}>
                {children}
              </div>
              </SessionTimeoutProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
