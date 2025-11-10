'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { Account } from '@/types/account'
import { useBaseColor } from '@/providers/base-colour-provider'
import useEmblaCarousel from 'embla-carousel-react'
import { Box } from '@radix-ui/themes'
import { PlusIcon, ListBulletIcon, BarChartIcon } from '@radix-ui/react-icons'
import { DoubleArrowLeftIcon, DoubleArrowRightIcon, ZoomInIcon } from '@radix-ui/react-icons'
import FormatCarouselContent from '../../utils/format-carousel-content/format-carousel-content'
import generateHues from '@/helpers/generate-hues'
import AccountsPills from '../../utils/account-pills/accounts-pills'
import { useParams, useRouter } from 'next/navigation'
import styles from './accounts-carousel.module.css'

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
  const { setBaseColor } = useBaseColor()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slideHue, setSlideHue] = useState<Record<number, string>>({ 0: hues[0] })
  const [hasInitialized, setHasInitialized] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HUE_LOCAL_STORAGE_KEY)
      if (saved) {
        setSlideHue(JSON.parse(saved))
      }
    } catch (e) {
      console.warn('Failed to load hues from localStorage', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(HUE_LOCAL_STORAGE_KEY, JSON.stringify(slideHue))
    } catch (e) {
      console.warn('Failed to save hues to localStorage', e)
    }
  }, [slideHue])

  useEffect(() => {
    if (!emblaApi || !accounts.length || hasInitialized) return

    if (selectedAccount) {
      const accountIndex = accounts.findIndex(acc => acc.uniqueId === selectedAccount)
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

      if (index === 0) {
        setSelectedAccount(null)
      } else {
        const account = accounts[index - 1]
        setSelectedAccount(account?.uniqueId ?? null)
      }

      const hue = slideHue[index] ?? hues[index % hues.length]
      setBaseColor?.(hue)
    }

    emblaApi.on('select', onSelect)
    onSelect() // initial

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, accounts, setSelectedAccount, setBaseColor, hues, slideHue])

  const handleSetHue = (hue: string) => {
    setSlideHue((prev) => ({
      ...prev,
      [selectedIndex]: hue,
    }))
    setBaseColor?.(hue)
  }

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance ?? 0),
    0
  )

  return (
    <>
      <Box className={styles.embla}>
        <div className={styles.embla__viewport} ref={emblaRef}>
          <div className={styles.embla__container}>

            {}
            <div className={styles.embla__slide}>
              <FormatCarouselContent
                accountType="Total Balance"
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
            label: 'Add Account',
            onClick: () => window.open(process.env.NEXT_PUBLIC_ADD_ACCOUNT_URL, '_blank'),
          },
          {
            key: 'details',
            icon: <ZoomInIcon width="35" height="35" />,
            label: 'Details',
            onClick: () => console.log('Details clicked'),
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
            onClick: () => console.log('More clicked'),
          },
        ]}
      />
    </>
  )
}
