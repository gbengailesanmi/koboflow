'use client'

import React from 'react'
import { useActionState } from 'react'
import { signup } from '@/app/actions/signup'
import { handleGoogleSignIn } from '@/app/actions/google-signin'

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined)

  const onGoogleSignIn = async () => {
    await handleGoogleSignIn()
  }

  return (
    <>
      <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="firstName">First Name</label>
        <input id="firstName" name="firstName" placeholder="First Name" required autoComplete="given-name" />
        {state?.errors?.firstName && <p>{state.errors.firstName.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="lastName">Last Name</label>
        <input id="lastName" name="lastName" placeholder="Last Name" required autoComplete="family-name" />
        {state?.errors?.lastName && <p>{state.errors.lastName.join(', ')}</p>}
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

    {/* Divider */}
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

    {/* Google Sign-Up Button */}
    <button
      type="button"
      onClick={onGoogleSignIn}
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
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb'
        e.currentTarget.style.borderColor = '#d1d5db'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'white'
        e.currentTarget.style.borderColor = '#e5e7eb'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  </>
  )
}
