import ThemeProviders from '@/providers/theme-providers'
import { Open_Sans } from 'next/font/google'
import SessionTimeoutProvider from '@/providers/session-timeout-provider'
import { getSettings, getSession } from '@/app/api/api-service'

import './globals.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin']
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Only fetch settings if user is authenticated
  const session = await getSession()
  const settings = session ? await getSettings() : null
  const userTheme = settings?.appearance?.theme || 'system'

  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProviders initialTheme={userTheme}>
            <SessionTimeoutProvider>
              {/* <div style={{ minHeight: '100vh', width: '100%' }}> */}
                {children}
              {/* </div> */}
              </SessionTimeoutProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
