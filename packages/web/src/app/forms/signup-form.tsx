'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignupForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)

    const payload = {
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      email: String(formData.get('email') || '').trim().toLowerCase(),
      password: String(formData.get('password') || ''),
      passwordConfirm: String(formData.get('passwordConfirm') || ''),
    }

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.password ||
      !payload.passwordConfirm
    ) {
      setError('All fields are required')
      setPending(false)
      return
    }

    if (payload.password !== payload.passwordConfirm) {
      setError('Passwords do not match')
      setPending(false)
      return
    }

    try {
      // ✅ BACKEND SIGNUP ONLY
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data?.message || 'Signup failed')
        setPending(false)
        return
      }

      // ✅ DO NOT AUTO-LOGIN
      router.push('/verify-email')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="firstName" placeholder="First name" required />
      <input name="lastName" placeholder="Last name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <input
        name="passwordConfirm"
        type="password"
        placeholder="Confirm password"
        required
      />

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      {/* Google signup/login */}
      <button
        type="button"
        onClick={() => signIn('google')}
        className="w-full border p-3"
      >
        Continue with Google
      </button>
    </form>
  )
}
