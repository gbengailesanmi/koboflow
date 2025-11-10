'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clearAllAppSessionStorage } from '@/hooks/use-session-storage'

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

  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email' || pathname?.startsWith('/verify-email')

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return
    }
    
    isLoggingOutRef.current = true

    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
        warningRef.current = null
      }

      setShowWarning(false)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${API_URL}/api/session`, { 
        method: 'DELETE',
        credentials: 'include', // Send cookies
      })
      
      clearAllAppSessionStorage()
      
      router.push('/login?timeout=true')
    } catch (error) {
      console.error('Error during automatic logout:', error)
      router.push('/login')
    } finally {
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 2000)
    }
  }, [router])

  const resetTimer = useCallback(() => {
    if (isPublicPage) {
      return
    }

    if (isLoggingOutRef.current) {
      return
    }

    const now = Date.now()
    if (now - lastActivityRef.current < 1000) {
      return
    }
    lastActivityRef.current = now

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    if (showWarning) {
      setShowWarning(false)
      setCountdown(120)
    }

    warningRef.current = setTimeout(() => {
      if (!isLoggingOutRef.current) {
        setShowWarning(true)
        setCountdown(120)
      }
    }, TIMEOUT_DURATION - WARNING_DURATION)

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
    if (isPublicPage) {
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

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const throttledResetTimer = () => {
      resetTimer()
    }

    resetTimer()

    events.forEach((event) => {
      document.addEventListener(event, throttledResetTimer, { passive: true })
    })

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
      
      {}
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
