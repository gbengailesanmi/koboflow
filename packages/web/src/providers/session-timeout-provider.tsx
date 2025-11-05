'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const TIMEOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const WARNING_DURATION = 2 * 60 * 1000 // Show warning 2 minutes before timeout

type SessionTimeoutProviderProps = {
  children: React.ReactNode
}

export default function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120) // 2 minutes in seconds
  const isLoggingOutRef = useRef(false)

  // Check if user is on a public page (login/signup)
  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email' || pathname?.startsWith('/verify-email')

  const logout = useCallback(async () => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) {
      return
    }
    
    isLoggingOutRef.current = true

    try {
      // Clear all timers first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
        warningRef.current = null
      }

      // Hide warning modal
      setShowWarning(false)

      // Call logout API - this will clear the cookie on the server
      await fetch('/api/session', { 
        method: 'DELETE',
        credentials: 'same-origin', // Ensure cookies are sent
      })
      
      // Redirect to login with timeout flag
      router.push('/login?timeout=true')
    } catch (error) {
      console.error('Error during automatic logout:', error)
      router.push('/login')
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 2000)
    }
  }, [router])

  const resetTimer = useCallback(() => {
    // Don't track activity on public pages
    if (isPublicPage) {
      return
    }

    // Don't reset if currently logging out
    if (isLoggingOutRef.current) {
      return
    }

    // Throttle activity tracking - only reset if at least 1 second has passed
    const now = Date.now()
    if (now - lastActivityRef.current < 1000) {
      return
    }
    lastActivityRef.current = now

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Hide warning if it's showing
    if (showWarning) {
      setShowWarning(false)
      setCountdown(120)
    }

    // Set warning timer (13 minutes - shows warning 2 minutes before logout)
    warningRef.current = setTimeout(() => {
      if (!isLoggingOutRef.current) {
        setShowWarning(true)
        setCountdown(120)
      }
    }, TIMEOUT_DURATION - WARNING_DURATION)

    // Set logout timer (15 minutes)
    timeoutRef.current = setTimeout(() => {
      if (!isLoggingOutRef.current) {
        logout()
      }
    }, TIMEOUT_DURATION)
  }, [isPublicPage, logout, showWarning])

  const continueSession = useCallback(() => {
    setShowWarning(false)
    setCountdown(120)
    resetTimer()
  }, [resetTimer])

  // Countdown timer for warning modal
  useEffect(() => {
    if (!showWarning) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showWarning])

  useEffect(() => {
    // Don't setup listeners on public pages
    if (isPublicPage) {
      // Clear any existing timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
        warningRef.current = null
      }
      setShowWarning(false)
      isLoggingOutRef.current = false
      return
    }

    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Throttled reset function to prevent excessive calls
    const throttledResetTimer = () => {
      resetTimer()
    }

    // Start the timer initially (only once when entering protected page)
    resetTimer()

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledResetTimer, { passive: true })
    })

    // Cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledResetTimer)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
        warningRef.current = null
      }
    }
  }, [isPublicPage]) // Only re-run when isPublicPage changes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {children}
      
      {/* Session Timeout Warning Modal */}
      {showWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>
              ⏱️
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 12px',
            }}>
              Session Expiring Soon
            </h2>
            
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              Your session will expire due to inactivity in:
            </p>
            
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: countdown <= 30 ? '#ef4444' : '#667eea',
              marginBottom: '24px',
              fontFamily: 'monospace',
            }}>
              {formatTime(countdown)}
            </div>
            
            <button
              onClick={continueSession}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              Continue Session
            </button>
            
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Log Out Now
            </button>
          </div>
        </div>
      )}
    </>
  )
}
