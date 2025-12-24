import Providers from './providers'
import { Open_Sans } from 'next/font/google'
import { getSettings, getSession } from '@/app/api/api-service'

import './globals.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin']
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const settings = session ? await getSettings() : null
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
