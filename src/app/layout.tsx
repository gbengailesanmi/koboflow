import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Theme } from "@radix-ui/themes"
import { ThemeProvider } from "next-themes"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}


export const metadata: Metadata = {
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Theme>
            <div className="bg-blue-950 min-h-screen w-full">
              {children}
            </div>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  )
}

