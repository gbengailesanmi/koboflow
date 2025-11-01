'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './verify-email.module.css'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (token) {
      // Verify the token
      fetch(`/api/verify-email?token=${token}`)
        .then(async (res) => {
          const data = await res.json()
          if (data.success) {
            setStatus('success')
            setMessage('Email verified successfully! Redirecting...')
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push(`/${data.customerId}/dashboard`)
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
          <button 
            onClick={() => router.push('/login')}
            className={styles.loginButton}
          >
            Back to Login
          </button>
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
