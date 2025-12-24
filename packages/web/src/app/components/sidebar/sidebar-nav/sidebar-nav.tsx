'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import styles from './sidebar-nav.module.css'

type NavSection = {
  id: string
  label: string
  items: {
    id: string
    label: string
    scrollTo?: string
  }[]
}

type SidebarNavProps = {
  customerId: string
}

export default function SidebarNav({ customerId }: SidebarNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

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

  useState(() => {
    if (currentPage && !expandedSections.includes(currentPage)) {
      setExpandedSections([currentPage])
    }
  })

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
  }

  const handleItemClick = (sectionId: string, item: { scrollTo?: string }) => {
    const isCurrentPage = currentPage === sectionId

    if (isCurrentPage && item.scrollTo) {
      const element = document.getElementById(item.scrollTo)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      router.push(`/${customerId}/${sectionId}`)
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
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <nav className={styles.nav}>
          {navSections.map((section) => {
            const isExpanded = expandedSections.includes(section.id)
            const isActive = currentPage === section.id

            return (
              <div key={section.id} className={styles.section}>
                {}
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
                    {isExpanded ? (
                      <ChevronDownIcon className={styles.chevron} />
                    ) : (
                      <ChevronRightIcon className={styles.chevron} />
                    )}
                  </button>
                </div>

                {}
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
  )
}
