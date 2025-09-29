'use client'

import { useState, useEffect } from 'react'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { redirect, useParams, useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import styles from './profile-page-client.module.css'

type User = {
  customerId: string
  name: string
  email: string
}

type ProfilePageClientProps = {
  user: User
}

export default function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  // Sync form data when user prop changes (after successful update)
  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email
    })
  }, [user.name, user.email])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim()
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(result.success || 'Profile updated successfully!')
      setIsEditing(false)
      
      // Refresh the page to get updated data from server
      router.refresh()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div>
          
          {/* Header */}
            <div className={styles.header}>
            <div className={styles.backButton}>
              <ArrowLeftIcon
              className={styles.backIcon}
              onClick={() => redirect(`/${customerId}/dashboard`)}
              style={{ color: '#222222' }}
              />
            </div>
            <div className={styles.headerCenter}>
              <h1 className={styles.title}>Profile Settings</h1>
            </div>
            </div>
            <div className={styles.subtitle}>
            <p className={styles.subtitleText}>Your account information</p>
            </div>

          {/* Profile Card */}
          <div className={styles.profileCard}>
            
            {/* Customer ID Section */}
            <div className={styles.customerIdSection}>
              <label className={styles.label}>
                Customer ID
              </label>
              <div className={styles.customerIdText}>
                {user.customerId}
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className={styles.alertError}>
                <p className={`${styles.alertText} ${styles.alertTextError}`}>{error}</p>
              </div>
            )}

            {success && (
              <div className={styles.alertSuccess}>
                <p className={`${styles.alertText} ${styles.alertTextSuccess}`}>{success}</p>
              </div>
            )}

            {/* Name Field */}
            <div className={styles.fieldContainer}>
              <label className={styles.labelWithIcon}>
                <PersonIcon className={styles.iconWithMargin} />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your full name'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>{formData.name}</span>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className={styles.emailFieldContainer}>
              <label className={styles.labelWithIcon}>
                <EnvelopeClosedIcon className={styles.iconWithMargin} />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your email address'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>{formData.email}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonContainer}>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`${styles.button} ${styles.buttonPrimary} ${loading ? styles.buttonDisabled : ''}`}
                  >
                    <CheckIcon className={styles.icon} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className={`${styles.button} ${styles.buttonSecondary} ${loading ? styles.buttonDisabled : ''}`}
                  >
                    <Cross2Icon className={styles.icon} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  <Pencil1Icon className={styles.icon} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}
