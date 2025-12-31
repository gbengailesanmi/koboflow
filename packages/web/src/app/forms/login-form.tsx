'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoginFormSchema } from '@/lib/definitions'

export default function LoginForm({
  isTimeout = false,
}: {
  isTimeout?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)

    const payload = {
      email: formData.get('email')?.toString().toLowerCase().trim() ?? '',
      password: formData.get('password')?.toString() ?? '',
    }

    const parsed = LoginFormSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      setPending(false)
      return
    }

    const result = await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    if (result?.error) {
      setError(
        result.error === 'EMAIL_NOT_VERIFIED'
          ? 'Please verify your email first'
          : 'Invalid email or password'
      )
      setPending(false)
      return
    }

    router.replace('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTimeout && (
        <p className="text-yellow-700">
          Your session expired. Please log in again.
        </p>
      )}

      <div>
        <label>Email</label>
        <input name="email" type="email" required />
      </div>

      <div>
        <label>Password</label>
        <input name="password" type="password" required />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </button>

      <button type="button" onClick={() => signIn('google')}>
        Continue with Google
      </button>
    </form>
  )
}
