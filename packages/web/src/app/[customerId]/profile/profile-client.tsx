'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfileAction } from '@/app/actions/update-user-profile-action'
import { useToasts } from '@/store'
import Sidebar from '@/app/components/sidebar/sidebar'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { PageHeader } from '@/app/components/page-header/page-header'
import { 
  Button, 
  TextField, 
  Select, 
  Text,
  Flex,
  Box,
} from '@radix-ui/themes'
import styles from './profile.module.css'

type ProfileClientProps = {
  customerId: string
  firstName: string
  lastName: string
  email: string
}

export default function ProfileClient({
  customerId,
  firstName,
  lastName,
  email
}: ProfileClientProps) {
  const router = useRouter()
  
  const { showToast } = useToasts()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSave = async () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      showToast('First name, last name, and email are required', 'error')
      return
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setSavingProfile(true)

    try {
      const result = await updateUserProfileAction(customerId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      })

      if (!result.success) {
        showToast(result.message || 'Failed to update profile', 'error')
        return
      }

      showToast('Profile updated successfully!', 'success')
      setIsEditing(false)
      
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
      email
    })
    setIsEditing(false)
  }

  return (
    <Sidebar customerId={customerId}>
      <div className={`${styles.container}`}>
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
          </div>
        </div>
        
        <Footer buttonColor='#222222' opacity={50} />
      </div>
    </Sidebar>
  )
}
