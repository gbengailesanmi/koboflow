'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { clearAllAppSessionStorage } from '@/hooks/use-session-storage'

const TIMEOUT_DURATION = 15 * 60 * 1000
const WARNING_DURATION = 2 * 60 * 1000

export default function SessionTimeoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef(Date.now())
  const isLoggingOutRef = useRef(false)

  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120)

  const isPublicPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/verify-email')

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    clearTimeout(timeoutRef.current!)
    clearTimeout(warningRef.current!)

    await signOut({ redirect: false })
    clearAllAppSessionStorage()

    router.push('/login?timeout=true')
  }, [router])

  const resetTimer = useCallback(() => {
    if (isPublicPage || isLoggingOutRef.current) return

    const now = Date.now()
    if (now - lastActivityRef.current < 1000) return
    lastActivityRef.current = now

    clearTimeout(timeoutRef.current!)
    clearTimeout(warningRef.current!)

    setShowWarning(false)
    setCountdown(120)

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(120)
    }, TIMEOUT_DURATION - WARNING_DURATION)

    timeoutRef.current = setTimeout(logout, TIMEOUT_DURATION)
  }, [isPublicPage, logout])

  useEffect(() => {
    if (isPublicPage) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'click']

    events.forEach((e) =>
      document.addEventListener(e, resetTimer, { passive: true })
    )

    resetTimer()

    return () => {
      events.forEach((e) =>
        document.removeEventListener(e, resetTimer)
      )
      clearTimeout(timeoutRef.current!)
      clearTimeout(warningRef.current!)
    }
  }, [resetTimer, isPublicPage])

  useEffect(() => {
    if (!showWarning) return

    const interval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [showWarning])

  return (
    <>
      {children}

      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-white p-8 rounded-xl text-center max-w-sm w-full">
            <h2>Session expiring</h2>
            <p>Logging out in {countdown}s</p>

            <button onClick={resetTimer}>Continue session</button>
            <button onClick={logout}>Log out now</button>
          </div>
        </div>
      )}
    </>
  )
}
