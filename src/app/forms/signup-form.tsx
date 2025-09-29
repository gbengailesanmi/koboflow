'use client'

import React from 'react'
import { useActionState } from 'react'
import { signup } from '@/app/actions/signup'

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Name" required autoComplete="name" />
        {state?.errors?.name && <p>{state.errors.name.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="Email" required autoComplete="email" />
        {state?.errors?.email && <p>{state.errors.email.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Password" required autoComplete="new-password" />
        {(state?.errors?.password ?? []).length > 0 && (
          <ul>
            {(state?.errors?.password ?? []).map((msg, i) => (
              <li key={i}>- {msg}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="passwordConfirm">Confirm Password</label>
        <input id="passwordConfirm" name="passwordConfirm" type="password" placeholder="Confirm Password" required autoComplete="new-password" />
        {state?.errors?.passwordConfirm && <p>{state.errors.passwordConfirm.join(', ')}</p>}
      </div>

      {state?.message && <p>{state.message}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Signing Up...' : 'Sign Up'}
      </button>
    </form>
  )
}
