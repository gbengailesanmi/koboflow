'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile } from '@/lib/api-service'
import { useToasts } from '@/store'
import Sidebar from '@/app/components/sidebar/sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { PageHeader } from '@/app/components/page-header/page-header'
import { useBaseColor } from '@/providers/base-colour-provider'
import { 
  Button, 
  TextField, 
  Select, 
  Text,
  Flex,
  Box,
} from '@radix-ui/themes'
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

type ProfileClientProps = {
  customerId: string
  firstName: string
  lastName: string
  email: string
  currency: string
  totalBudgetLimit: number
}

export default function ProfileClient({
  customerId,
  firstName,
  lastName,
  email,
  currency,
  totalBudgetLimit
}: ProfileClientProps) {
  const router = useRouter()
  const { setBaseColor } = useBaseColor()
  
  // ✅ Use UI store for toast notifications
  const { showToast } = useToasts()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email,
    currency,
    totalBudgetLimit: totalBudgetLimit.toString()
  })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const colorWithTransparency = `${PAGE_COLORS.profile}4D`
    setBaseColor(colorWithTransparency)
  }, [setBaseColor])

  const handleSave = async () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      showToast('First name, last name, and email are required', 'error')
      return
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    const budgetValue = parseFloat(formData.totalBudgetLimit)
    if (isNaN(budgetValue) || budgetValue < 0) {
      showToast('Please enter a valid total budget limit', 'error')
      return
    }

    setSavingProfile(true)

    try {
      const result = await updateUserProfile(customerId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        currency: formData.currency,
        totalBudgetLimit: budgetValue,
      })

      if (!result.success) {
        showToast(result.message || 'Failed to update profile', 'error')
        return
      }

      showToast('Profile updated successfully!', 'success')
      setIsEditing(false)
      
      // Router refresh will get fresh data from revalidated cache
      router.refresh()

    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName,
      lastName,
      email,
      currency,
      totalBudgetLimit: totalBudgetLimit.toString()
    })
    setIsEditing(false)
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
                  {customerId}
                </div>
              </div>

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
