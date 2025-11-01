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
  currency?: string
  monthlyBudget?: number
}

type ProfilePageClientProps = {
  user: User
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
]

export default function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [budgetSetInBudgetPage, setBudgetSetInBudgetPage] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    currency: user.currency || 'USD',
    monthlyBudget: user.monthlyBudget?.toString() || '0'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  // Check if budget was set from budget page
  useEffect(() => {
    async function checkBudgetSource() {
      try {
        const response = await fetch('/api/budget')
        if (response.ok) {
          const data = await response.json()
          // If budget exists in budget collection and has a monthly value, it was set from budget page
          setBudgetSetInBudgetPage(data.monthly > 0 && data.categories?.length >= 0)
        }
      } catch (error) {
        console.error('Failed to check budget source:', error)
      }
    }
    checkBudgetSource()
  }, [])

  // Sync form data when user prop changes (after successful update)
  useEffect(() => {
    // Only sync if we're not currently editing to avoid overwriting user changes
    if (!isEditing) {
      setFormData({
        name: user.name,
        email: user.email,
        currency: user.currency || 'USD',
        monthlyBudget: user.monthlyBudget?.toString() || '0'
      })
    }
  }, [user.name, user.email, user.currency, user.monthlyBudget, isEditing])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate monthly budget
    const budgetValue = parseFloat(formData.monthlyBudget)
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Please enter a valid monthly budget')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        currency: formData.currency,
        monthlyBudget: budgetValue
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(result.success || 'Profile updated successfully!')
      setIsEditing(false)
      
      // Don't immediately refresh - let the success state show first
      // Refresh after a short delay to ensure server has processed the update
      setTimeout(() => {
        router.refresh()
      }, 1000)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to current user data, but preserve any valid currency selection
    setFormData({
      name: user.name,
      email: user.email,
      currency: user.currency || formData.currency || 'USD',
      monthlyBudget: user.monthlyBudget?.toString() || '0'
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
              <h1 className={styles.title}>Profile</h1>
            </div>
            </div>
            <div className={styles.subtitle}>
            <p className={styles.subtitleText}>Manage your account settings and preferences</p>
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
            <div className={styles.fieldContainer}>
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

            {/* Currency Field */}
            <div className={styles.fieldContainer}>
              <label className={styles.labelWithIcon}>
                💰 Preferred Currency
              </label>
              {isEditing ? (
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className={styles.input}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>
                    {currencies.find(c => c.code === formData.currency)?.symbol} {currencies.find(c => c.code === formData.currency)?.name} ({formData.currency})
                  </span>
                </div>
              )}
            </div>

            {/* Monthly Budget Field */}
            <div className={styles.emailFieldContainer}>
              <label className={styles.labelWithIcon}>
                📊 Monthly Budget
              </label>
              {isEditing ? (
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your monthly budget'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>
                    {currencies.find(c => c.code === formData.currency)?.symbol}{parseFloat(formData.monthlyBudget).toLocaleString()}
                  </span>
                </div>
              )}
              <p className={styles.helpText}>
                Set a monthly spending limit to track your budget
              </p>
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

          {/* About Section */}
          <div className={styles.profileCard}>
            <h2 className={styles.aboutTitle}>About Money Mapper</h2>
            <p className={styles.aboutSubtitle}>Personal finance tracking made simple</p>
            <div className={styles.aboutContent}>
              <p className={styles.aboutText}>
                Money Mapper helps you track your income and expenses, visualize spending patterns,
                and make informed financial decisions.
              </p>
              <p className={styles.aboutText}>
                All your data is stored securely and privately, ensuring complete control over your financial information.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}
