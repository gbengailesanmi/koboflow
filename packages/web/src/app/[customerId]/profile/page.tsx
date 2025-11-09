'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { PageHeader } from '@/app/components/page-header/page-header'
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
import styles from './profile.module.css'

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

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const { setBaseColor } = useBaseColor()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false)
  const [budgetSetInBudgetPage, setBudgetSetInBudgetPage] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currency: 'USD',
    totalBudgetLimit: '0'
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes: any = await apiClient.getSession()
        if (!sessionRes.success || sessionRes.user.customerId !== customerId) {
          router.push('/login')
          return
        }

        const [budgetRes, settingsRes]: any[] = await Promise.all([
          apiClient.getBudget(),
          apiClient.getSettings(),
        ])

        const profile = {
          customerId: sessionRes.user.customerId,
          email: sessionRes.user.email,
          firstName: sessionRes.user.firstName,
          lastName: sessionRes.user.lastName,
          currency: sessionRes.user.currency,
        }

        setData({
          profile,
          totalBudgetLimit: budgetRes?.totalBudgetLimit || 0,
          settings: settingsRes.settings || {},
        })

        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          currency: profile.currency || 'USD',
          totalBudgetLimit: (budgetRes?.totalBudgetLimit || 0).toString()
        })
      } catch (error) {
        console.error('Failed to load profile data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, router])

  useEffect(() => {
    if (data?.settings?.pageColors?.profile) {
      const colorWithTransparency = `${data.settings.pageColors.profile}4D`
      setBaseColor(colorWithTransparency)
    }
  }, [data, setBaseColor])

  useEffect(() => {
    async function checkBudgetSource() {
      try {
        const response = await fetch('/api/budget')
        if (response.ok) {
          const budgetData = await response.json()
          setBudgetSetInBudgetPage(budgetData.monthly > 0 && budgetData.categories?.length >= 0)
        }
      } catch (error) {
        console.error('Failed to check budget source:', error)
      }
    }
    checkBudgetSource()
  }, [])

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

    setSavingProfile(true)
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
      
      setTimeout(() => {
        router.refresh()
      }, 1000)
      
      setTimeout(() => setSuccess(''), 3000)

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancel = () => {
    if (data?.profile) {
      setFormData({
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        email: data.profile.email,
        currency: data.profile.currency || 'USD',
        totalBudgetLimit: data.totalBudgetLimit?.toString() || '0'
      })
    }
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  if (loading || !data) {
    return (
      <Sidebar customerId={customerId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar customerId={customerId}>
      <div className={`${styles.container} page-gradient-background`}>
        <div className={styles.wrapper}>
          <div>
            <PageHeader 
              title="Profile" 
              subtitle="Manage your account settings and preferences"
            />

            {/* User Info Card */}
            <div id="user-info" className={styles.profileCard}>
              {/* Customer ID Section */}
              <div className={styles.customerIdSection}>
                <label className={styles.label}>
                  Customer ID
                </label>
                <div className={styles.customerIdText}>
                  {data.profile.customerId}
                </div>
              </div>

              {/* Error and Success Messages */}
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
                      disabled={savingProfile}
                      variant="solid"
                    >
                      <CheckIcon />
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={savingProfile}
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
    </Sidebar>
  )
}
