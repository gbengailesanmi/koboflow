// packages/web/src/app/layout.tsx
import Providers from './providers'
import { Open_Sans } from 'next/font/google'

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
  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
