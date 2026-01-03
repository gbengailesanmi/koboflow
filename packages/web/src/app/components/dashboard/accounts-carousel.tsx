'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import type { Account } from '@money-mapper/shared'
import useEmblaCarousel from 'embla-carousel-react'
import { Box } from '@radix-ui/themes'
import { PlusIcon, ListBulletIcon, BarChartIcon } from '@radix-ui/react-icons'
import { DoubleArrowLeftIcon, DoubleArrowRightIcon, ZoomInIcon } from '@radix-ui/react-icons'
import FormatCarouselContent from './format-carousel-content'
import generateHues from '@/helpers/generate-hues'
import AccountsPills from './accounts-pills'
import { useParams, useRouter } from 'next/navigation'
import { useMonoConnect } from '@/hooks/use-mono-connect'
import { useHorizontalScrollRestoration } from '@/hooks/use-scroll-restoration'
import styles from './dashboard.module.css'

const HUE_LOCAL_STORAGE_KEY = 'accounts-carousel-slide-hue'

type AccountsCarouselProps = {
  accounts: Account[]
  selectedAccount: string | null
  setSelectedAccount: (id: string | null) => void
  onNavigate?: () => void
}

export default function AccountsCarousel({
  accounts,
  selectedAccount,
  setSelectedAccount,
  onNavigate,
}: AccountsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const hues = generateHues(10)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slideHue, setSlideHue] = useState<Record<number, string>>({ 0: hues[0] })
  const [hasInitialized, setHasInitialized] = useState(false)
  const carouselContainerRef = useRef<HTMLDivElement>(null)
  
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  // Restore carousel scroll position when returning to this page
  useHorizontalScrollRestoration(carouselContainerRef, 'accounts-carousel')

  const { openMonoWidget, isLoading: isConnecting } = useMonoConnect({
    onSuccess: () => {
      // Success handled
    },
    onError: (error) => {
      alert(`Failed to link account: ${error}`)
    },
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HUE_LOCAL_STORAGE_KEY)
      if (saved) {
        setSlideHue(JSON.parse(saved))
      }
    } catch (e) {
      // Error handled
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(HUE_LOCAL_STORAGE_KEY, JSON.stringify(slideHue))
    } catch (e) {
      // Error handled
    }
  }, [slideHue])

  useEffect(() => {
    if (!emblaApi || !accounts.length || hasInitialized) return

    if (selectedAccount) {
      const accountIndex = accounts.findIndex(acc => acc.id === selectedAccount)
      if (accountIndex !== -1) {
        emblaApi.scrollTo(accountIndex + 1, true)
      }
    }
    
    setHasInitialized(true)
  }, [emblaApi, accounts, selectedAccount, hasInitialized])

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
    onNavigate?.()
  }, [emblaApi, onNavigate])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
    onNavigate?.()
  }, [emblaApi, onNavigate])

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap()
      setSelectedIndex(index)

      const nextAccountId =
        index === 0 ? null : accounts[index - 1]?.id ?? null

      if (nextAccountId !== selectedAccount) {
        setSelectedAccount(nextAccountId)
      }
    }

    emblaApi.on('select', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, accounts, selectedAccount, setSelectedAccount])

  const handleSetHue = (hue: string) => {
    setSlideHue((prev) => ({
      ...prev,
      [selectedIndex]: hue,
    }))
  }

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance ?? 0),
    0
  )

  return (
    <>
      <Box className={styles.embla}>
        <div 
          className={styles.embla__viewport} 
          ref={(node) => {
            emblaRef(node)
            if (carouselContainerRef) {
              (carouselContainerRef as any).current = node
            }
          }}
        >
          <div className={styles.embla__container}>

            {}
            <div className={styles.embla__slide}>
              <FormatCarouselContent
                accountType="Total Net Worth"
                accountName="All Accounts"
                balance={totalBalance}
              />
            </div>

            {}
            {accounts.map((account) => (
              <div key={account.id} className={styles.embla__slide}>
                <FormatCarouselContent
                  accountType={account.type}
                  accountName={account.name}
                  balance={Number(account.balance)}
                />
              </div>
            ))}

          </div>
        </div>
      </Box>

      {}
      {}

      <div className="flex w-20 justify-between">
        <button onClick={scrollPrev} aria-label="Previous account">
          <DoubleArrowLeftIcon width="18" height="18" />
        </button>
        <button onClick={scrollNext} aria-label="Next account">
          <DoubleArrowRightIcon width="18" height="18" />
        </button>
      </div>

      <AccountsPills
        buttons={[
          {
            key: 'add',
            icon: <PlusIcon width="35" height="35" />,
            label: isConnecting ? 'Connecting...' : 'Add Account',
            onClick: openMonoWidget,
          },
          {
            key: 'details',
            icon: <ZoomInIcon width="35" height="35" />,
            label: 'Details',
            onClick: () => {},
          },
          {
            key: 'analytics',
            icon: <BarChartIcon width="35" height="35" />,
            label: 'Analytics',
            onClick: () => router.push(`/${customerId}/analytics`),
          },
          {
            key: 'more',
            icon: <ListBulletIcon width="35" height="35" />,
            label: 'More',
            onClick: () => {},
          },
        ]}
      />
    </>
  )
}
