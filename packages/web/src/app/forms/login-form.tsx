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
        // Redirect to dashboard with customerId
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
    </form>
  )
}
