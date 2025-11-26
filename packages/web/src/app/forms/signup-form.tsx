'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signupClient } from '@/lib/api-client'
import { SignupFormSchema } from '@money-mapper/shared'
import config from '@/config'

export default function SignupForm() {
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const firstName = formData.get('firstName')?.toString().trim() || ''
    const lastName = formData.get('lastName')?.toString().trim() || ''
    const email = formData.get('email')?.toString().trim().toLowerCase() || ''
    const password = formData.get('password')?.toString() || ''
    const passwordConfirm = formData.get('passwordConfirm')?.toString() || ''

    const parsed = SignupFormSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      passwordConfirm,
    })

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors)
      setPending(false)
      return
    }

    try {
      const result: any = await signupClient({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
      })

      if (result.success) {
        if (result.requiresVerification) {
          router.push('/verify-email')
        } else {
          router.push(`/${result.user.customerId}/dashboard`)
        }
      } else {
        setMessage(result.message || 'Failed to create account.')
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to create account.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          placeholder="First Name"
          required
          autoComplete="given-name"
        />
        {errors.firstName && <p className="text-red-500">{errors.firstName.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          placeholder="Last Name"
          required
          autoComplete="family-name"
        />
        {errors.lastName && <p className="text-red-500">{errors.lastName.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
        />
        {errors.email && <p className="text-red-500">{errors.email.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="new-password"
        />
        {errors.password && errors.password.length > 0 && (
          <ul className="text-red-500">
            {errors.password.map((msg, i) => (
              <li key={i}>- {msg}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="passwordConfirm">Confirm Password</label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          placeholder="Confirm Password"
          required
          autoComplete="new-password"
        />
        {errors.passwordConfirm && (
          <p className="text-red-500">{errors.passwordConfirm.join(', ')}</p>
        )}
      </div>

      {message && <p className="text-red-500">{message}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Signing Up...' : 'Sign Up'}
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
          const backendUrl = config.BACKEND_URL
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
