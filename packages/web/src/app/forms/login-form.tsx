'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

export default function LoginForm({ isTimeout = false }: { isTimeout?: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')?.toString().toLowerCase() || ''
    const password = formData.get('password')?.toString() || ''

    if (!email || !password) {
      setError('All fields are required.')
      setPending(false)
      return
    }

    try {
      const result: any = await apiClient.login({ email, password })
      
      if (result.success) {
        router.push(`/${result.user.customerId}/dashboard`)
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTimeout && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          color: '#92400e',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          ⏱️ Your session expired due to inactivity. Please log in again.
        </div>
      )}
      <div>
        <label>Email</label>
        <input name="email" type="email" required />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" required />
      </div>
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: error.includes('verify your email') ? '#fef3c7' : '#fee2e2',
          border: `1px solid ${error.includes('verify your email') ? '#fbbf24' : '#f87171'}`,
          borderRadius: '8px',
          color: error.includes('verify your email') ? '#92400e' : '#991b1b',
          fontSize: '14px',
        }}>
          {error}
          {error.includes('verify your email') && (
            <div style={{ marginTop: '8px' }}>
              <a href="/verify-email" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Resend verification email
              </a>
            </div>
          )}
        </div>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Logging in...' : 'Log In'}
      </button>

      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '24px 0',
        gap: '12px'
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        <span style={{ color: '#6b7280', fontSize: '14px' }}>or</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
      </div>

      {}
      <button
        type="button"
        onClick={() => {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          window.location.href = `${backendUrl}/api/auth/google`
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 24px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: '#374151',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb'
          e.currentTarget.style.borderColor = '#d1d5db'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white'
          e.currentTarget.style.borderColor = '#e5e7eb'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10V12.05H15.4818C15.2273 13.3 14.5182 14.3591 13.4636 15.0682V17.5773H16.7636C18.7182 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
          <path d="M10 20C12.7 20 14.9636 19.1045 16.7636 17.5773L13.4636 15.0682C12.5636 15.6682 11.3818 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H0.995454V14.4909C2.78636 18.0591 6.10909 20 10 20Z" fill="#34A853"/>
          <path d="M4.40455 11.9C4.18182 11.3 4.05455 10.6591 4.05455 10C4.05455 9.34091 4.18182 8.7 4.40455 8.1V5.50909H0.995454C0.363636 6.77273 0 8.18182 0 10C0 11.8182 0.363636 13.2273 0.995454 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
          <path d="M10 3.97727C11.4682 3.97727 12.7864 4.48182 13.8227 5.47273L16.6909 2.60455C14.9591 0.990909 12.6955 0 10 0C6.10909 0 2.78636 1.94091 0.995454 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </form>
  )
}
