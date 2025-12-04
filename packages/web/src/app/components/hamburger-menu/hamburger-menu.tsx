'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { HamburgerMenuIcon, ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Dialog, Flex, Text, Box, ScrollArea, Switch } from '@radix-ui/themes'
import { updateSettingsAction } from '@/app/actions/update-settings-action'
import { useToasts } from '@/store'
import type { UserSettings } from '@money-mapper/shared'
import styles from './hamburger-menu.module.css'

type NavSection = {
  id: string
  label: string
  items: {
    id: string
    label: string
    scrollTo?: string
  }[]
}

type HamburgerMenuProps = {
  customerId: string
}

export default function HamburgerMenu({ customerId }: HamburgerMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()
  const { showToast } = useToasts()
  const [open, setOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && (resolvedTheme === 'dark')

  const handleThemeToggle = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light'
    
    // Immediately apply visual theme
    setTheme(newTheme)
    
    // Save to database
    try {
      const result = await updateSettingsAction({
        appearance: { theme: newTheme }
      } as Partial<UserSettings>)
      
      if (!result.success) {
        showToast(result.message || 'Failed to save theme preference', 'error')
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      showToast('Failed to save theme preference', 'error')
    }
  }

  const navSections: NavSection[] = [
    {
      id: 'analytics',
      label: 'ANALYTICS',
      items: [
        { id: 'stats-cards', label: 'Stats Overview', scrollTo: 'stats-cards' },
        { id: 'expense-breakdown', label: 'Expense Breakdown', scrollTo: 'expense-breakdown' },
        { id: 'daily-comparison', label: 'Daily Expense', scrollTo: 'daily-comparison' },
        { id: 'spending-category', label: 'Spending by Category', scrollTo: 'spending-category' },
        { id: 'recurring-payments', label: 'Recurring Payments', scrollTo: 'recurring-payments' },
        { id: 'budget-overview', label: 'Budget Overview', scrollTo: 'budget-overview' },
      ]
    },
    {
      id: 'budget',
      label: 'BUDGET',
      items: [
        { id: 'monthly-budget', label: 'Budget', scrollTo: 'monthly-budget' },
        { id: 'category-budgets', label: 'Category Budgets', scrollTo: 'category-budgets' },
        { id: 'add-category', label: 'Add Category Budget', scrollTo: 'add-category' },
      ]
    },
    {
      id: 'transactions',
      label: 'TRANSACTIONS',
      items: [
        { id: 'filters', label: 'Filters', scrollTo: 'filters' },
        { id: 'transaction-list', label: 'Transaction List', scrollTo: 'transaction-list' },
      ]
    },
    {
      id: 'profile',
      label: 'PROFILE',
      items: [
        { id: 'user-info', label: 'User Information', scrollTo: 'user-info' },
        { id: 'currency-settings', label: 'Currency Settings', scrollTo: 'currency-settings' },
        { id: 'about', label: 'About', scrollTo: 'about' },
      ]
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      items: [
        { id: 'user-profile', label: 'User Profile', scrollTo: 'user-profile' },
        { id: 'appearance', label: 'Appearance', scrollTo: 'appearance' },
        { id: 'notifications', label: 'Notifications', scrollTo: 'notifications' },
        { id: 'security', label: 'Security', scrollTo: 'security' },
        { id: 'support', label: 'Support', scrollTo: 'support' },
        { id: 'about-app', label: 'About', scrollTo: 'about-app' },
        { id: 'account', label: 'Account Management', scrollTo: 'account' },
      ]
    },
  ]

  const getCurrentPage = () => {
    if (pathname.includes('/analytics')) return 'analytics'
    if (pathname.includes('/budget')) return 'budget'
    if (pathname.includes('/transactions')) return 'transactions'
    if (pathname.includes('/profile')) return 'profile'
    if (pathname.includes('/settings')) return 'settings'
    return null
  }

  const currentPage = getCurrentPage()

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSectionClick = (sectionId: string) => {
    router.push(`/${customerId}/${sectionId}`)
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections([...expandedSections, sectionId])
    }
    setOpen(false)
  }

  const handleItemClick = (sectionId: string, item: { scrollTo?: string }) => {
    const isCurrentPage = currentPage === sectionId

    if (isCurrentPage && item.scrollTo) {
      const element = document.getElementById(item.scrollTo)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setOpen(false)
    } else {
      router.push(`/${customerId}/${sectionId}`)
      setOpen(false)
      setTimeout(() => {
        if (item.scrollTo) {
          const element = document.getElementById(item.scrollTo)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }, 500)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <button
          className={styles.hamburgerButton}
          aria-label="Open navigation menu"
        >
          <HamburgerMenuIcon width="15" height="15" />
        </button>
      </Dialog.Trigger>

      <Dialog.Content 
        className={styles.menuContent}
        style={{ maxWidth: '400px', padding: '0' }}
      >
        <Flex align="center" justify="between" px="4" pt="4" pb="2" className={styles.titleWrapper}>
          <Dialog.Title className={styles.menuTitle}>
            Navigation
          </Dialog.Title>
          {mounted && (
            <Switch 
              checked={isDarkMode} 
              onCheckedChange={handleThemeToggle}
              size="2"
            />
          )}
        </Flex>

        <ScrollArea 
          type="auto" 
          scrollbars="vertical" 
          style={{ height: '70vh' }}
        >
          <Flex direction="column" gap="2" p="4">
            {navSections.map((section) => {
              const isExpanded = expandedSections.includes(section.id)
              const isActive = currentPage === section.id

              return (
                <Box key={section.id} className={styles.section}>
                  <Flex
                    align="center"
                    justify="between"
                    className={`${styles.sectionHeader} ${isActive ? styles.sectionHeaderActive : ''}`}
                    p="2"
                  >
                    <Text 
                      size="2" 
                      weight="bold"
                      className={styles.sectionLabel}
                      onClick={() => handleSectionClick(section.id)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      {section.label}
                    </Text>
                    <button
                      className={styles.expandButton}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        toggleSection(section.id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon width="16" height="16" />
                      ) : (
                        <ChevronRightIcon width="16" height="16" />
                      )}
                    </button>
                  </Flex>

                  {isExpanded && (
                    <Flex direction="column" gap="1" pl="4" pt="2">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          className={styles.item}
                          onClick={() => handleItemClick(section.id, item)}
                        >
                          <Text size="2">{item.label}</Text>
                        </button>
                      ))}
                    </Flex>
                  )}
                </Box>
              )
            })}
          </Flex>
        </ScrollArea>
      </Dialog.Content>
    </Dialog.Root>
  )
}
