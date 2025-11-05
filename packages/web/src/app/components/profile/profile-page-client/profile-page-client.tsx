'use client'

import { useState, useEffect } from 'react'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header/page-header'
import { apiClient } from '@/lib/api-client'
import { useBaseColor } from '@/providers/base-colour-provider'
import { 
  Grid, 
  Card, 
  Badge, 
  Button, 
  IconButton,
  TextField, 
  Select, 
  Separator,
  Avatar,
  Heading,
  Text,
  Flex,
  Box,
  Callout
} from '@radix-ui/themes'
import { InfoCircledIcon } from '@radix-ui/react-icons'
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

  useEffect(() => {
    async function checkBudgetSource() {
      try {
        const response = await fetch('/api/budget')
        if (response.ok) {
          const data = await response.json()
          setBudgetSetInBudgetPage(data.monthly > 0 && data.categories?.length >= 0)
        }
      } catch (error) {
        console.error('Failed to check budget source:', error)
      }
    }
    checkBudgetSource()
  }, [])

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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    const budgetValue = parseFloat(formData.totalBudgetLimit)
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Please enter a valid total budget limit')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result: any = await apiClient.updateProfile(customerId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        currency: formData.currency,
        totalBudgetLimit: budgetValue
      })

      if (!result.success) {
        setError(result.message || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Don't immediately refresh - let the success state show first
      // Refresh after a short delay to ensure server has processed the update
      setTimeout(() => {
        router.refresh()
      }, 1000)
      
      setTimeout(() => setSuccess(''), 3000)

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
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

            <Box className={styles.fieldContainer}>
              <Text as="label" size="2" weight="medium" className={styles.labelWithIcon}>
                <PersonIcon className={styles.iconWithMargin} />
                First Name
              </Text>
              {isEditing ? (
                <TextField.Root
                  type='text'
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder='Enter your first name'
                />
              ) : (
                <div className={styles.displayField}>
                  <Text className={styles.displayText}>{formData.firstName}</Text>
                </div>
              )}
            </Box>

            <Box className={styles.fieldContainer}>
              <Text as="label" size="2" weight="medium" className={styles.labelWithIcon}>
                <PersonIcon className={styles.iconWithMargin} />
                Last Name
              </Text>
              {isEditing ? (
                <TextField.Root
                  type='text'
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder='Enter your last name'
                />
              ) : (
                <div className={styles.displayField}>
                  <Text className={styles.displayText}>{formData.lastName}</Text>
                </div>
              )}
            </Box>

            <Box className={styles.fieldContainer}>
              <Text as="label" size="2" weight="medium" className={styles.labelWithIcon}>
                <EnvelopeClosedIcon className={styles.iconWithMargin} />
                Email Address
              </Text>
              {isEditing ? (
                <TextField.Root
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder='Enter your email address'
                />
              ) : (
                <div className={styles.displayField}>
                  <Text className={styles.displayText}>{formData.email}</Text>
                </div>
              )}
            </Box>

            <Box id="currency-settings" className={styles.fieldContainer}>
              <Text as="label" size="2" weight="medium" className={styles.labelWithIcon}>
                💰 Preferred Currency
              </Text>
              {isEditing ? (
                <Select.Root
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <Select.Trigger className={styles.input} />
                  <Select.Content>
                    {currencies.map((currency) => (
                      <Select.Item key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              ) : (
                <div className={styles.displayField}>
                  <Text className={styles.displayText}>
                    {currencies.find(c => c.code === formData.currency)?.symbol} {currencies.find(c => c.code === formData.currency)?.name} ({formData.currency})
                  </Text>
                </div>
              )}
            </Box>

            <Box className={styles.emailFieldContainer}>
              <Text as="label" size="2" weight="medium" className={styles.labelWithIcon}>
                📊 Monthly Budget
              </Text>
              {isEditing ? (
                <TextField.Root
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.totalBudgetLimit}
                  onChange={(e) => setFormData({ ...formData, totalBudgetLimit: e.target.value })}
                  placeholder='Enter your monthly budget'
                />
              ) : (
                <div className={styles.displayField}>
                  <Text className={styles.displayText}>
                    {currencies.find(c => c.code === formData.currency)?.symbol}{parseFloat(formData.totalBudgetLimit).toLocaleString()}
                  </Text>
                </div>
              )}
              <Text size="2" color="gray" className={styles.helpText}>
                Set a monthly spending limit to track your budget
              </Text>
            </Box>

            <Flex className={styles.buttonContainer} gap="3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    variant="solid"
                  >
                    <CheckIcon />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={loading}
                    variant="soft"
                  >
                    <Cross2Icon />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="soft"
                >
                  <Pencil1Icon />
                  Edit Profile
                </Button>
              )}
            </Flex>
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
