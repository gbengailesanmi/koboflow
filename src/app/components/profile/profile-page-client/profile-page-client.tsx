'use client'

import { useState, useEffect } from 'react'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { redirect, useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header/page-header'
import { updateProfile } from '@/app/actions/profile'
import { useBaseColor } from '@/providers/base-colour-provider'
import styles from './profile-page-client.module.css'

type User = {
  customerId: string
  firstName: string
  lastName: string
  email: string
  currency?: string
  totalBudgetLimit?: number
}

type ProfilePageClientProps = {
  user: User
  pageColor: string
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

export default function ProfilePageClient({ user, pageColor }: ProfilePageClientProps) {
  const { setBaseColor } = useBaseColor()
  const [isEditing, setIsEditing] = useState(false)
  const [budgetSetInBudgetPage, setBudgetSetInBudgetPage] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    currency: user.currency || 'USD',
    totalBudgetLimit: user.totalBudgetLimit?.toString() || '0'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  // Set page color with 30% transparency
  useEffect(() => {
    const colorWithTransparency = `${pageColor}4D` // 30% transparency
    setBaseColor(colorWithTransparency)
  }, [pageColor, setBaseColor])

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
    if (!isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        currency: user.currency || 'USD',
        totalBudgetLimit: user.totalBudgetLimit?.toString() || '0'
      })
    }
  }, [user.firstName, user.lastName, user.email, user.currency, user.totalBudgetLimit, isEditing])

  const handleSave = async () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      setError('First name, last name, and email are required')
      return
    }

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate total budget limit
    const budgetValue = parseFloat(formData.totalBudgetLimit)
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Please enter a valid total budget limit')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        currency: formData.currency,
        totalBudgetLimit: budgetValue
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
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currency: user.currency || formData.currency || 'USD',
      totalBudgetLimit: user.totalBudgetLimit?.toString() || '0'
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className={`${styles.container} page-gradient-background`}>
      <div className={styles.wrapper}>
        <div>
          
          {/* Header */}
          <PageHeader 
            title="Profile" 
            subtitle="Manage your account settings and preferences"
          />

          {/* Profile Card */}
          <div id="user-info" className={styles.profileCard}>
            
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

            {/* First Name Field */}
            <div className={styles.fieldContainer}>
              <label className={styles.labelWithIcon}>
                <PersonIcon className={styles.iconWithMargin} />
                First Name
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your first name'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>{formData.firstName}</span>
                </div>
              )}
            </div>

            {/* Last Name Field */}
            <div className={styles.fieldContainer}>
              <label className={styles.labelWithIcon}>
                <PersonIcon className={styles.iconWithMargin} />
                Last Name
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your last name'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>{formData.lastName}</span>
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
            <div id="currency-settings" className={styles.fieldContainer}>
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
                  value={formData.totalBudgetLimit}
                  onChange={(e) => setFormData({ ...formData, totalBudgetLimit: e.target.value })}
                  className={styles.input}
                  placeholder='Enter your monthly budget'
                />
              ) : (
                <div className={styles.displayField}>
                  <span className={styles.displayText}>
                    {currencies.find(c => c.code === formData.currency)?.symbol}{parseFloat(formData.totalBudgetLimit).toLocaleString()}
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
          <div id="about" className={styles.profileCard}>
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
      
      <Footer buttonColor='#222222' opacity={50} />
    </div>
  )
}
