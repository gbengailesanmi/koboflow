import AppProviders from '@/providers/app-providers'
import { Open_Sans } from 'next/font/google'

import './globals.css'
import styles from './layout.module.css'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin']
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={openSans.variable}>
      <body>
        <AppProviders>
          <div className={styles.container}>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  )
}
