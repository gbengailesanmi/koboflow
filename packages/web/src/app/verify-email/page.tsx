'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import styles from './verify-email.module.css'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('Verifying your email...')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (token) {
      setStatus('verifying')
      // Verify the token
      fetch(`/api/verify-email?token=${token}`)
        .then(async (res) => {
          const data = await res.json()
          if (data.success) {
            setStatus('success')
            setMessage('Email verified successfully! Redirecting to login...')
            // Redirect to login after 2 seconds
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          } else {
            setStatus('error')
            setMessage(data.message || 'Verification failed')
          }
        })
        .catch(() => {
          setStatus('error')
          setMessage('An error occurred during verification')
        })
    }
  }, [token, router])

  const handleResendEmail = async () => {
    const email = prompt('Please enter your email address:')
    if (!email) return

    setResending(true)
    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        alert('Verification email sent! Please check your inbox.')
      } else {
        alert(data.message || 'Failed to send verification email')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>📧</span>
          </div>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.description}>
            We've sent a verification link to your email address. 
            Please check your inbox and click the link to verify your account.
          </p>
          <div className={styles.tips}>
            <h3 className={styles.tipsTitle}>Didn't receive the email?</h3>
            <ul className={styles.tipsList}>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
              onClick={handleResendEmail}
              disabled={resending}
              className={styles.resendButton}
            >
              {resending ? 'Sending...' : 'Resend Email'}
            </button>
            <button 
              onClick={() => router.push('/login')}
              className={styles.loginButton}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'verifying' && (
          <>
            <div className={styles.iconWrapper}>
              <div className={styles.spinner}></div>
            </div>
            <h1 className={styles.title}>Verifying Email...</h1>
            <p className={styles.description}>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>✅</span>
            </div>
            <h1 className={styles.title}>Email Verified!</h1>
            <p className={styles.description}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>❌</span>
            </div>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.description}>{message}</p>
            <button 
              onClick={() => router.push('/login')}
              className={styles.loginButton}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
