'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const customerId = searchParams.get('customerId')
    const error = searchParams.get('error')

    if (error) {
      router.push(`/login?error=${error}`)
      return
    }

    if (token && customerId) {
      // Store token in localStorage
      localStorage.setItem('authToken', token)
      
      // Redirect to dashboard
      router.push(`/${customerId}/dashboard`)
    } else {
      router.push('/login?error=invalid_callback')
    }
  }, [searchParams, router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: '#6b7280' }}>Completing sign in...</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
