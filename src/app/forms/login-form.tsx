'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/login'

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)
  const searchParams = useSearchParams()
  const isTimeout = searchParams.get('timeout') === 'true'

  return (
    <form action={formAction} className="space-y-4">
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
      {state?.message && <p>{state.message}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  )
}
