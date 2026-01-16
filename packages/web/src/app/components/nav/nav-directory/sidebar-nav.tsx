'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ChevronRightIcon, HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons'
import { Switch } from '@radix-ui/themes'
import { settingsUpdateAction } from '@/app/actions/settings.actions'
import { runAction } from '@/lib/actions/run-action'
import type { UserSettings } from '@koboflow/shared'
import styles from './sidebar-nav.module.css'

// Navigation sections data
const navSections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    items: [
      { id: 'overview', label: 'Overview', scrollTo: 'overview' },
      { id: 'accounts-summary', label: 'Accounts Summary', scrollTo: 'accounts-summary' },
      { id: 'recent-activity', label: 'Recent Activity', scrollTo: 'recent-activity' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    route: '/analytics',
    items: [
      { id: 'balance-history', label: 'Balance History', scrollTo: 'balance-history' },
      { id: 'spending-overview', label: 'Spending Overview', scrollTo: 'spending-overview' },
      { id: 'category-breakdown', label: 'Category Breakdown', scrollTo: 'category-breakdown' },
      { id: 'spending-trends', label: 'Spending Trends', scrollTo: 'spending-trends' }
    ]
  },
  {
    id: 'budget',
    label: 'Budget',
    route: '/budget',
    items: [
      { id: 'budget-overview', label: 'Budget Overview', scrollTo: 'budget-overview' },
      { id: 'category-budgets', label: 'Category Budgets', scrollTo: 'category-budgets' }
    ]
  },
  {
    id: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    items: [
      { id: 'transaction-body', label: 'All Transactions', scrollTo: 'transaction-body' },
      { id: 'filters', label: 'Filters', scrollTo: 'filters' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    route: '/settings',
    items: [
      { id: 'personal-details', label: 'Personal Details', route: '/settings/personal-details' },
      { id: 'manage-accounts', label: 'Manage Accounts', route: '/settings/manage-accounts' },
      { id: 'reconnect-accounts', label: 'Reconnect Accounts', route: '/settings/reconnect-accounts' },
      { id: 'manage-notifications', label: 'Manage Notifications', route: '/settings/manage-notifications' }
    ]
  }
]

// Hook to get current page from pathname
function useCurrentPage() {
  const pathname = usePathname()
  
  if (!pathname) return null
  
  if (pathname.includes('/dashboard')) return 'dashboard'
  if (pathname.includes('/analytics')) return 'analytics'
  if (pathname.includes('/budget')) return 'budget'
  if (pathname.includes('/transactions')) return 'transactions'
  if (pathname.includes('/settings')) return 'settings'
  
  return null
}

type NavProps = {
  customerId: string
}

export default function Nav({ customerId }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentPage = useCurrentPage()
  const { setTheme, resolvedTheme } = useTheme()
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (currentPage && !expandedSections.includes(currentPage)) {
      setExpandedSections([currentPage])
    }
  }, [currentPage, expandedSections])

  const isDarkMode = mounted && (resolvedTheme === 'dark')

  const handleThemeToggle = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light'
    setTheme(newTheme)
    
    try {
      await runAction(settingsUpdateAction, {
        appearance: { theme: newTheme }
      } as Partial<UserSettings>)
    } catch (error) {
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSectionClick = (sectionId: string) => {
    const section = navSections.find(s => s.id === sectionId)
    if (section?.route) {
      router.push(`/${customerId}${section.route}`)
      setIsOpen(false)
    }
  }

  const handleItemClick = (sectionId: string, item: { id: string, scrollTo?: string, route?: string }) => {
    if (item.route) {
      router.push(`/${customerId}${item.route}`)
      setIsOpen(false)
    } else if (item.scrollTo) {
      const section = navSections.find(s => s.id === sectionId)
      if (section?.route) {
        const targetPath = `/${customerId}${section.route}`
        if (pathname === targetPath) {
          const element = document.getElementById(item.scrollTo)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        } else {
          router.push(`${targetPath}#${item.scrollTo}`)
        }
        setIsOpen(false)
      }
    }
  }

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        className={styles.hamburgerButton}
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <HamburgerMenuIcon width="24" height="24" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <aside className={`${styles.navDirectory} ${isOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.directoryContent}>
          {/* Header with Close Button and Theme Toggle */}
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>Navigation</h2>
            <div className={styles.mobileHeaderActions}>
              {mounted && (
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={handleThemeToggle}
                  size="2"
                />
              )}
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
              >
                <Cross1Icon width="20" height="20" />
              </button>
            </div>
          </div>

          <nav className={styles.nav}>
            {navSections.map((section) => {
              const isExpanded = expandedSections.includes(section.id)
              const isActive = currentPage === section.id

              return (
                <div key={section.id} className={styles.section}>
                  <div
                    className={`${styles.sectionHeader} ${isActive ? styles.sectionHeaderActive : ''}`}
                  >
                    <span 
                      className={styles.sectionLabel}
                      onClick={() => handleSectionClick(section.id)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      {section.label}
                    </span>
                    <button
                      className={styles.expandButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSection(section.id)
                      }}
                    >
                      <ChevronRightIcon 
                        className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`} 
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className={styles.items}>
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          className={styles.item}
                          onClick={() => handleItemClick(section.id, item)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
