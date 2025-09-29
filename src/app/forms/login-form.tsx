'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/login'

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <form action={formAction} className="space-y-4">
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
