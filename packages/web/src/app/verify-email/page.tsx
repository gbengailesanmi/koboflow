// /Users/gbenga.ilesanmi/Github/PD/koboflow/packages/web/src/app/verify-email/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { securityResendVerificationEmailAction } from '@/app/actions/security.actions'
import styles from './verify-email.module.css'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')
        
    if (verified === 'true') {
      setStatus('success')
      setMessage('Email verified successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else if (error) {
      setStatus('error')
      if (error === 'invalid') {
        setMessage('Invalid or expired verification token')
      } else {
        setMessage('An error occurred during verification')
      }
    }
  }, [router, searchParams])

  const handleResendEmail = async () => {
    const email = prompt('Please enter your email address:')
    if (!email) return

    setResending(true)
    try {
      const result = await securityResendVerificationEmailAction(email)
      if (result.success) {
        alert('Verification email sent! Please check your inbox.')
      } else {
        alert(result.message || 'Failed to send verification email')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (status === 'idle') {
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
