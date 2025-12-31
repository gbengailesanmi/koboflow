// packages/web/src/app/layout.tsx
import Providers from './providers'
import { Open_Sans } from 'next/font/google'
import { getAuthSession } from '@/lib/server/get-server-session'
import { getSettings } from '@/lib/server/api-service'

import './globals.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  const settings =
    session?.user?.customerId
      ? await getSettings()
      : null

  const userTheme = settings?.appearance?.theme || 'system'

  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body>
        <Providers initialTheme={userTheme}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
